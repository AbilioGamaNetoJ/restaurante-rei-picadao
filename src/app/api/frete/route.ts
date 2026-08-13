import { NextResponse } from 'next/server';
import { db } from '@/db';
import { deliveryQuotes } from '@/db/schema';
import { freightRequestSchema, getAddressHash } from '@/lib/checkout';
import { calculateDistance, geocodeAddress } from '@/lib/google-maps';
import { checkRateLimit, createRateLimitHeaders, getRequestIp } from '@/lib/rate-limit';
import { originGuard } from '@/lib/origin-guard';

const QUOTE_TTL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const csrfReject = originGuard(request);
  if (csrfReject) return csrfReject;

  const rateLimit = await checkRateLimit('freight', getRequestIp(request));
  const rateLimitHeaders = createRateLimitHeaders(rateLimit);

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.unavailable ? 'Serviço temporariamente indisponível.' : 'Muitas consultas de frete. Tente novamente em alguns minutos.' },
      { status: rateLimit.unavailable ? 503 : 429, headers: rateLimitHeaders },
    );
  }

  try {
    const validation = freightRequestSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: 'Endereço inválido para cálculo de frete.' }, { status: 400, headers: rateLimitHeaders });
    }

    const address = validation.data;
    const settings = await db.query.storeSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'Configurações da loja não encontradas.' }, { status: 503, headers: rateLimitHeaders });
    }

    let origin = { lat: Number(settings.lat), lng: Number(settings.lng) };
    if (!origin.lat || !origin.lng) {
      const geocodedOrigin = await geocodeAddress(settings.address);
      if (!geocodedOrigin) {
        return NextResponse.json({ error: 'Não foi possível calcular o frete no momento.' }, { status: 502, headers: rateLimitHeaders });
      }
      origin = geocodedOrigin;
    }

    const fullAddress = `${address.addressStreet}, ${address.addressNumber}, ${address.addressNeighborhood}, ${address.addressCity}, ${address.addressState}, ${address.addressZip}, Brazil`;
    const destination = await geocodeAddress(fullAddress);
    if (!destination) {
      return NextResponse.json({ error: 'Não foi possível localizar este endereço.' }, { status: 400, headers: rateLimitHeaders });
    }

    const route = await calculateDistance(origin, destination);
    if (!route) {
      return NextResponse.json({ error: 'Não foi possível calcular a rota.' }, { status: 502, headers: rateLimitHeaders });
    }

    const maximumDistanceKm = Number(settings.deliveryRadiusKm);
    if (route.distanceKm > maximumDistanceKm) {
      return NextResponse.json(
        { error: `Não realizamos entregas acima de ${maximumDistanceKm} km de distância.` },
        { status: 422, headers: rateLimitHeaders },
      );
    }

    const deliveryFee = Math.round(route.distanceKm * Number(settings.deliveryFeeKm) * 100) / 100;
    const expiresAt = new Date(Date.now() + QUOTE_TTL_MS);
    const [quote] = await db.insert(deliveryQuotes).values({
      addressHash: getAddressHash(address),
      distanceKm: route.distanceKm.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      expiresAt,
    }).returning({ id: deliveryQuotes.id });

    return NextResponse.json(
      { quoteId: quote.id, distanceKm: route.distanceKm, deliveryFee, expiresAt: expiresAt.toISOString() },
      { headers: rateLimitHeaders },
    );
  } catch (error) {
    console.error('Delivery quote failed', error);
    return NextResponse.json({ error: 'Erro interno ao calcular o frete.' }, { status: 500, headers: rateLimitHeaders });
  }
}
