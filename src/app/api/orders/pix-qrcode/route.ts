import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentByExternalReference } from '@/lib/asaas';
import { getTrackableOrder } from '@/lib/order-access';
import { checkRateLimit, createRateLimitHeaders, getRequestIp } from '@/lib/rate-limit';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const trackingQuerySchema = z.object({
  orderId: z.string().uuid(),
  token: z.string().min(32).max(128),
});

export async function GET(request: Request) {
  const rateLimit = await checkRateLimit('pixQrCode', getRequestIp(request));
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

    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      console.error('ASAAS_API_KEY is not configured');
      return NextResponse.json({ error: 'Serviço temporariamente indisponível.' }, { status: 503, headers: rateLimitHeaders });
    }

    const payment = await getPaymentByExternalReference(order.id);
    if (!payment || payment.billingType !== 'PIX') {
      return NextResponse.json({ qrCode: null }, { headers: rateLimitHeaders });
    }

    const response = await fetch(`${ASAAS_API_URL}/payments/${payment.id}/pixQrCode`, {
      headers: { access_token: apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error('Asaas PIX QR code request failed', { status: response.status });
      return NextResponse.json({ qrCode: null }, { headers: rateLimitHeaders });
    }

    return NextResponse.json({ qrCode: await response.json() }, { headers: rateLimitHeaders });
  } catch (error) {
    console.error('PIX QR code request failed', error);
    return NextResponse.json({ error: 'Não foi possível consultar o pedido.' }, { status: 502, headers: rateLimitHeaders });
  }
}
