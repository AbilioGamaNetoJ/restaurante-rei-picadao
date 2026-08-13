import { createHash, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { orders, pushSubscriptions } from '@/db/schema';
import { refundPayment } from '@/lib/asaas';

const webhookSchema = z.object({
  event: z.string().min(1).max(100),
  payment: z.object({
    id: z.string().min(1).max(120),
    externalReference: z.string().uuid(),
    billingType: z.string().min(1).max(60).optional(),
    status: z.string().min(1).max(60).optional(),
  }).passthrough(),
}).passthrough();

const paidEvents = new Set(['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED']);
const cancelledEvents = new Set([
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
]);

function hasValidWebhookToken(receivedToken: string | null, configuredToken: string | undefined) {
  if (!receivedToken || !configuredToken) return false;

  const receivedHash = createHash('sha256').update(receivedToken).digest();
  const configuredHash = createHash('sha256').update(configuredToken).digest();
  return timingSafeEqual(receivedHash, configuredHash);
}

export async function POST(request: Request) {
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!webhookToken) {
    console.error('ASAAS_WEBHOOK_TOKEN is not configured');
    return NextResponse.json({ error: 'Webhook unavailable.' }, { status: 503 });
  }

  if (!hasValidWebhookToken(request.headers.get('asaas-access-token'), webhookToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const input = webhookSchema.safeParse(await request.json());
    if (!input.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { event, payment } = input.data;
    if (!paidEvents.has(event) && !cancelledEvents.has(event)) {
      return NextResponse.json({ received: true });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, payment.externalReference),
    });
    if (!order) {
      console.warn('Webhook received for unknown order', { event });
      return NextResponse.json({ received: true });
    }

    if (paidEvents.has(event)) {
      if (order.status === 'cancelled') {
        try {
          await refundPayment(payment.id);
        } catch {
          console.error('Late payment refund failed', { orderId: order.id });
          return NextResponse.json({ error: 'Refund pending' }, { status: 500 });
        }
        return NextResponse.json({ received: true });
      }

      if (order.status === 'pending') {
        const [updatedOrder] = await db.update(orders)
          .set({
            status: 'paid',
            paymentId: payment.id,
            paymentMethod: payment.billingType ?? null,
            paymentStatus: payment.status ?? null,
            updatedAt: new Date(),
          })
          .where(and(eq(orders.id, order.id), eq(orders.status, 'pending')))
          .returning({ id: orders.id });

        if (updatedOrder) await sendOrderPushNotifications(order.id);
      }
    }

    if (cancelledEvents.has(event) && !['delivered', 'cancelled'].includes(order.status)) {
      await db.update(orders)
        .set({
          status: 'cancelled',
          paymentId: payment.id,
          paymentMethod: payment.billingType ?? null,
          paymentStatus: payment.status ?? null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(orders.id, order.id),
          inArray(orders.status, ['pending', 'paid', 'preparing', 'ready', 'delivering']),
        ));
    }

    revalidatePath('/dashboard');
    revalidatePath('/pedidos');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Asaas webhook processing failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function sendOrderPushNotifications(orderId: string) {
  try {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

    const subscriptions = await db.select().from(pushSubscriptions).where(inArray(
      pushSubscriptions.role,
      ['dono', 'gerente', 'funcionario'],
    ));
    if (subscriptions.length === 0) return;

    const { sendPushNotification } = await import('@/lib/web-push');
    const shortId = orderId.slice(0, 8).toUpperCase();
    const payload = {
      title: 'Novo pedido pago',
      body: `Pedido #${shortId} foi pago.`,
      url: '/pedidos',
      tag: `order-${orderId}`,
    };

    await Promise.allSettled(subscriptions.map(async (subscription) => {
      try {
        await sendPushNotification(subscription, payload);
      } catch (error) {
        if (error instanceof Error && error.message === 'SUBSCRIPTION_EXPIRED') {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
        }
      }
    }));
  } catch (error) {
    console.error('Order push notification failed', error);
  }
}
