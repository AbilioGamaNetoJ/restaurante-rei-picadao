import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, payment } = body;

    if (!payment || !payment.externalReference) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const orderId = payment.externalReference;
    let newStatus = undefined;

    // Asaas events
    // https://docs.asaas.com/docs/webhooks
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      newStatus = 'paid';
    } else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_REPROVED_BY_RISK_ANALYSIS') {
      newStatus = 'cancelled';
    }

    if (newStatus) {
      await db.update(orders)
        .set({ 
          status: newStatus as any,
          paymentId: payment.id,
          paymentMethod: payment.billingType,
          paymentStatus: payment.status
        })
        .where(eq(orders.id, orderId));
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook Asaas error:', error);
    // Return 200 anyway so Asaas doesn't retry unnecessarily if it's our internal parsing error,
    // though usually you'd return 500 to force a retry if it's a DB error.
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
