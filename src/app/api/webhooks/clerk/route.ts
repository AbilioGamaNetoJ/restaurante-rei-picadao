import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

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

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const body = await req.text();
  if (body.length > 1_000_000) {
    return new Response('Payload too large', { status: 413 });
  }

  let evt: WebhookEvent;
  const bypassEnabled = process.env.ENABLE_WEBHOOK_BYPASS === 'true';
  const isDev = process.env.NODE_ENV === 'development';
  const bypass = headerPayload.get('x-test-bypass') === 'true';
  const bypassKey = headerPayload.get('x-test-bypass-key');
  const configuredBypassKey = process.env.CLERK_BYPASS_KEY;

  // Verify the payload with the headers
  try {
    if (bypassEnabled && isDev && bypass) {
      if (!configuredBypassKey || bypassKey !== configuredBypassKey) {
        console.error('Clerk webhook bypass attempted with an invalid key');
        return new Response('Unauthorized bypass attempt', { status: 401 });
      }
      evt = JSON.parse(body) as WebhookEvent;
      console.log('Clerk webhook bypass verified and enabled for testing');
    } else {
      // Create a new Svix instance with your secret.
      const wh = new Webhook(WEBHOOK_SECRET);
      
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    }
  } catch {
    console.error('Clerk webhook signature verification failed');
    return new Response('Error occured', {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id } = evt.data;
    
    if (bypassEnabled && isDev && bypass) {
      console.log('Clerk metadata update bypassed for testing');
    } else {
      // Set default role to 'cliente' if not already set
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(id);
        
        if (!user.publicMetadata.role) {
          await client.users.updateUser(id, {
            publicMetadata: {
              role: 'cliente',
            },
          });
          console.log('Clerk user metadata updated with default role');
        }
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
