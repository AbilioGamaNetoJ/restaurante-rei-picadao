import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server';

function isBypassRequest(headerPayload: Awaited<ReturnType<typeof headers>>) {
  const bypassEnabled = process.env.ENABLE_WEBHOOK_BYPASS === 'true';
  const isDev = process.env.NODE_ENV === 'development';
  const bypass = headerPayload.get('x-test-bypass') === 'true';
  return bypassEnabled && isDev && bypass;
}

async function verifyClerkWebhook(
  body: string,
  headerPayload: Awaited<ReturnType<typeof headers>>,
  secret: string
): Promise<WebhookEvent | Response> {
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 });
  }

  if (isBypassRequest(headerPayload)) {
    const bypassKey = headerPayload.get('x-test-bypass-key');
    const configuredBypassKey = process.env.CLERK_BYPASS_KEY;
    if (!configuredBypassKey || bypassKey !== configuredBypassKey) {
      console.error('Clerk webhook bypass attempted with an invalid key');
      return new Response('Unauthorized bypass attempt', { status: 401 });
    }
    console.log('Clerk webhook bypass verified and enabled for testing');
    return JSON.parse(body) as WebhookEvent;
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(secret);
  return wh.verify(body, {
    'svix-id': svix_id,
    'svix-timestamp': svix_timestamp,
    'svix-signature': svix_signature,
  }) as WebhookEvent;
}

async function ensureDefaultRole(userId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  if (user.publicMetadata.role) return;

  await client.users.updateUser(userId, {
    publicMetadata: { role: 'cliente' },
  });
  console.log('Clerk user metadata updated with default role');
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not configured');
    return new Response('Webhook unavailable', { status: 503 });
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 1_000_000) {
    return new Response('Payload too large', { status: 413 });
  }

  const headerPayload = await headers();

  // Get the body
  const body = await req.text();
  if (body.length > 1_000_000) {
    return new Response('Payload too large', { status: 413 });
  }

  let evt: WebhookEvent;
  try {
    const result = await verifyClerkWebhook(body, headerPayload, WEBHOOK_SECRET);
    if (result instanceof Response) return result;
    evt = result;
  } catch {
    console.error('Clerk webhook signature verification failed');
    return new Response('Error occured', {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id } = evt.data;

    if (isBypassRequest(headerPayload)) {
      console.log('Clerk metadata update bypassed for testing');
    } else {
      try {
        await ensureDefaultRole(id);
      } catch (error) {
        console.error('Failed to update Clerk user metadata', error);
      }
    }
  }

  if (eventType === 'user.deleted') {
    console.log('Clerk user deletion received');
  }

  return new Response('', { status: 200 });
}
