import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, pushSubscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, payment } = body;

    // Security: Validate Asaas token
    const asaasToken = req.headers.get('asaas-access-token');
    if (process.env.ASAAS_WEBHOOK_TOKEN && asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!payment || !payment.externalReference) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const orderId = payment.externalReference;
    let newStatus = undefined;

    // Asaas events
    // https://docs.asaas.com/docs/webhooks
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      newStatus = 'paid';
    } else if (
      event === 'PAYMENT_OVERDUE' ||
      event === 'PAYMENT_DELETED' || 
      event === 'PAYMENT_REFUNDED' || 
      event === 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
    ) {
      newStatus = 'cancelled';
    }

    if (newStatus) {
      // Try to update the order, with retry for race condition resilience
      let updated = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const currentOrder = await db.query.orders.findFirst({
          where: eq(orders.id, orderId)
        });

        if (currentOrder) {
          // Se o pedido foi cancelado localmente, mas o Asaas confirmou o pagamento (ex: race condition do Pix)
          if (currentOrder.status === 'cancelled' && newStatus === 'paid') {
            console.log(`[webhook] Pagamento recebido para pedido já cancelado: ${orderId}. Iniciando estorno automático...`);
            try {
              const { refundPayment } = await import('@/lib/asaas');
              await refundPayment(payment.id);
            } catch (err) {
              console.error(`[webhook] Erro ao estornar pagamento atrasado do pedido ${orderId}:`, err);
            }
            newStatus = 'cancelled'; // Mantém o status como cancelado
          }

          const result = await db.update(orders)
            .set({ 
              status: newStatus as any,
              paymentId: payment.id,
              paymentMethod: payment.billingType,
              paymentStatus: payment.status
            })
            .where(eq(orders.id, orderId))
            .returning({ id: orders.id });

          if (result.length > 0) {
            updated = true;

            // Send push notification for paid orders
            if (newStatus === 'paid') {
              await sendOrderPushNotifications(currentOrder.customerName, orderId);
            }

            break;
          }
        }

        // Order not found yet — might still be inserting (race condition)
        // Wait briefly and retry
        if (attempt < 2) {
          console.warn(`[webhook] Order ${orderId} not found (attempt ${attempt + 1}/3), retrying in 2s...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (!updated) {
        console.error(`[webhook] Order ${orderId} not found after 3 attempts for event ${event}`);
      }
        
      revalidatePath('/dashboard');
      revalidatePath('/pedidos');
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook Asaas error:', error);
    // Return 200 anyway so Asaas doesn't retry unnecessarily if it's our internal parsing error,
    // though usually you'd return 500 to force a retry if it's a DB error.
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function sendOrderPushNotifications(customerName: string, orderId: string) {
  try {
    // Only send if VAPID keys are configured
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return;
    }

    const { sendPushNotification } = await import('@/lib/web-push');

    // Get all push subscriptions
    const subscriptions = await db.select().from(pushSubscriptions);

    if (subscriptions.length === 0) return;

    const shortId = orderId.slice(0, 8).toUpperCase();
    const payload = {
      title: '🔥 Novo Pedido!',
      body: `Pedido #${shortId} de ${customerName} foi pago`,
      url: '/pedidos',
      tag: `order-${orderId}`,
    };

    // Send to all subscriptions, clean up expired ones
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await sendPushNotification(sub, payload);
        } catch (error: any) {
          if (error.message === 'SUBSCRIPTION_EXPIRED') {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
            console.log(`[push] Cleaned up expired subscription: ${sub.endpoint.slice(0, 50)}...`);
          }
        }
      })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    console.log(`[push] Sent ${sent}/${subscriptions.length} push notifications for order ${shortId}`);
  } catch (error) {
    // Push notification failure should not break the webhook
    console.error('[push] Failed to send order notifications:', error);
  }
}
