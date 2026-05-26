import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
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
          break;
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

