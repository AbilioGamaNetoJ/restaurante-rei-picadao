import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getPaymentByExternalReference } from '@/lib/asaas';

/**
 * GET /api/orders/check-status?orderId=xxx
 * 
 * Fallback endpoint that checks payment status directly with the Asaas API
 * when the webhook hasn't updated the order yet (race condition mitigation).
 * 
 * Flow:
 * 1. Fetch order from DB
 * 2. If status is 'pending', query Asaas API directly
 * 3. If Asaas says RECEIVED/CONFIRMED, update DB to 'paid'
 * 4. Return current status
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // 1. Get current order status from DB
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { status: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. If already past pending, return current status (no need to check Asaas)
    if (order.status !== 'pending') {
      return NextResponse.json({ status: order.status });
    }

    // 3. Status is 'pending' — check Asaas API directly as fallback
    const asaasPayment = await getPaymentByExternalReference(orderId);

    if (asaasPayment) {
      const paidStatuses = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];
      
      if (paidStatuses.includes(asaasPayment.status)) {
        // Asaas confirms payment — update our DB (webhook missed or arrived too early)
        await db.update(orders)
          .set({
            status: 'paid' as any,
            paymentId: asaasPayment.id,
            paymentMethod: asaasPayment.billingType,
            paymentStatus: asaasPayment.status,
          })
          .where(eq(orders.id, orderId));

        console.log(`[check-status] Fallback sync: Order ${orderId} updated to 'paid' via Asaas API`);
        return NextResponse.json({ status: 'paid' });
      }
    }

    // 4. Still pending
    return NextResponse.json({ status: 'pending' });
  } catch (error) {
    console.error('[check-status] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
