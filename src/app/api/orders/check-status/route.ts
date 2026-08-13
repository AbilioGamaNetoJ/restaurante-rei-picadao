import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { getPaymentByExternalReference } from '@/lib/asaas';
import { getTrackableOrder } from '@/lib/order-access';
import { checkRateLimit, createRateLimitHeaders, getRequestIp } from '@/lib/rate-limit';

const trackingQuerySchema = z.object({
  orderId: z.string().uuid(),
  token: z.string().min(32).max(128),
});

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit('orderStatus', getRequestIp(request));
  const rateLimitHeaders = createRateLimitHeaders(rateLimit);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.unavailable ? 'Serviço temporariamente indisponível.' : 'Muitas consultas. Aguarde antes de tentar novamente.' },
      { status: rateLimit.unavailable ? 503 : 429, headers: rateLimitHeaders },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const validation = trackingQuerySchema.safeParse({
    orderId: searchParams.get('orderId'),
    token: searchParams.get('token'),
  });

  if (!validation.success) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404, headers: rateLimitHeaders });
  }

  try {
    const order = await getTrackableOrder(validation.data.orderId, validation.data.token);
    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404, headers: rateLimitHeaders });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ status: order.status }, { headers: rateLimitHeaders });
    }

    const payment = await getPaymentByExternalReference(order.id);
    if (payment && ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(payment.status)) {
      await db.update(orders)
        .set({
          status: 'paid',
          paymentId: payment.id,
          paymentMethod: payment.billingType,
          paymentStatus: payment.status,
        })
        .where(eq(orders.id, order.id));

      return NextResponse.json({ status: 'paid' }, { headers: rateLimitHeaders });
    }

    return NextResponse.json({ status: 'pending' }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('Order status check failed', error);
    return NextResponse.json({ error: 'Não foi possível consultar o pedido.' }, { status: 502, headers: rateLimitHeaders });
  }
}
