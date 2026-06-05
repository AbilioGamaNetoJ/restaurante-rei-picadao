import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST: Save a push subscription
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, p256dh, auth: authKey } = body;

    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 });
    }

    // Upsert: update if endpoint already exists, create otherwise
    await db
      .insert(pushSubscriptions)
      .values({
        userId,
        endpoint,
        p256dh,
        auth: authKey,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          p256dh,
          auth: authKey,
          userId,
        },
      });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[push/subscribe] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a push subscription
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, userId)
        )
      );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[push/subscribe] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
