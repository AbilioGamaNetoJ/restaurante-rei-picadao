import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
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
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;
  const isDev = process.env.NODE_ENV === 'development';
  const bypass = headerPayload.get('x-test-bypass') === 'true';

  // Verify the payload with the headers
  try {
    if (isDev && bypass) {
      evt = payload as WebhookEvent;
      console.log('Clerk webhook bypass enabled for testing');
    } else {
      // Create a new Svix instance with your secret.
      const wh = new Webhook(WEBHOOK_SECRET);
      
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    }
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id } = evt.data as any;
    
    if (isDev && bypass) {
      console.log(`[TEST] Clerk metadata update bypassed for user: ${id}`);
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
          console.log(`User ${id} metadata updated with default role: cliente`);
        }
      } catch (error) {
        console.error(`Error updating Clerk user ${id}:`, error);
      }
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data as any;
    // Note: Clerk doesn't provide email in user.deleted directly in the payload sometimes 
    // or it's hard to get. If we had a users table we would delete by clerkId.
    // Since we only have saved_addresses by email, we might need to have stored the email.
    console.log(`User ${id} deleted in Clerk`);
  }

  return new Response('', { status: 200 });
}
