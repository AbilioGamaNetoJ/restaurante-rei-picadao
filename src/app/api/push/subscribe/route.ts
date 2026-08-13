import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/schema';
import { can, getRoleFromClaims } from '@/lib/permissions';
import { checkRateLimit, createRateLimitHeaders, getRequestIp } from '@/lib/rate-limit';

const trustedPushHosts = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
];

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2_048),
  p256dh: z.string().min(16).max(512),
  auth: z.string().min(8).max(512),
}).strict();

const deleteSchema = z.object({ endpoint: z.string().url().max(2_048) }).strict();

function isTrustedPushEndpoint(endpoint: string) {
  const url = new URL(endpoint);
  return url.protocol === 'https:' && trustedPushHosts.some(
    (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
  );
}

async function getAuthorizedStaff() {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);
  return { userId, role };
}

export async function POST(request: Request) {
  try {
    const { userId, role } = await getAuthorizedStaff();
    if (!userId || !role || !can(role, 'view_orders')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const rateLimit = await checkRateLimit('pushSubscription', `${userId}:${getRequestIp(request)}`);
    const headers = createRateLimitHeaders(rateLimit);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.unavailable ? 'Serviço temporariamente indisponível.' : 'Muitas tentativas. Aguarde antes de tentar novamente.' },
        { status: rateLimit.unavailable ? 503 : 429, headers },
      );
    }

    const input = subscriptionSchema.safeParse(await request.json());
    if (!input.success || !isTrustedPushEndpoint(input.data.endpoint)) {
      return NextResponse.json({ error: 'Assinatura de notificação inválida.' }, { status: 400, headers });
    }

    const existing = await db.query.pushSubscriptions.findFirst({
      where: eq(pushSubscriptions.endpoint, input.data.endpoint),
    });

    if (existing && existing.userId !== userId) {
      return NextResponse.json({ error: 'Assinatura já vinculada a outro usuário.' }, { status: 409, headers });
    }

    if (existing) {
      await db.update(pushSubscriptions)
        .set({ p256dh: input.data.p256dh, auth: input.data.auth, role })
        .where(and(eq(pushSubscriptions.id, existing.id), eq(pushSubscriptions.userId, userId)));
    } else {
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: input.data.endpoint,
        p256dh: input.data.p256dh,
        auth: input.data.auth,
        role,
      });
    }

    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    console.error('Push subscription failed', error);
    return NextResponse.json({ error: 'Erro ao salvar a assinatura de notificação.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId, role } = await getAuthorizedStaff();
    if (!userId || !role || !can(role, 'view_orders')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const input = deleteSchema.safeParse(await request.json());
    if (!input.success || !isTrustedPushEndpoint(input.data.endpoint)) {
      return NextResponse.json({ error: 'Assinatura de notificação inválida.' }, { status: 400 });
    }

    await db.delete(pushSubscriptions).where(and(
      eq(pushSubscriptions.endpoint, input.data.endpoint),
      eq(pushSubscriptions.userId, userId),
    ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscription failed', error);
    return NextResponse.json({ error: 'Erro ao remover a assinatura de notificação.' }, { status: 500 });
  }
}
