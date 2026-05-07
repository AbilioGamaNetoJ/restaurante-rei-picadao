import { NextResponse } from 'next/server';
import { db } from '@/db';
import { storeSettings } from '@/db/schema';
import { calculateDistance, geocodeAddress } from '@/lib/google-maps';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { addressStreet, addressNumber, addressCity, addressState, addressZip } = body;

    if (!addressStreet || !addressNumber || !addressCity || !addressState || !addressZip) {
      return NextResponse.json(
        { error: 'Endereço incompleto para cálculo de frete.' },
        { status: 400 }
      );
    }

    const fullAddress = `${addressStreet}, ${addressNumber} - ${addressCity}, ${addressState}, ${addressZip}`;

    // 1. Get Store Settings
    const settings = await db.query.storeSettings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { error: 'Configurações da loja não encontradas.' },
        { status: 500 }
      );
    }

    // 2. Geocode store and customer addresses
    let origin = { lat: Number(settings.lat), lng: Number(settings.lng) };
    
    // Fallback if DB doesn't have lat/lng yet
    if (!origin.lat || !origin.lng) {
      const originGeo = await geocodeAddress(settings.address);
      if (!originGeo) {
        return NextResponse.json(
          { error: 'Falha ao localizar o endereço da loja.' },
          { status: 500 }
        );
      }
      origin = originGeo;
    }

    const destination = await geocodeAddress(fullAddress);
    if (!destination) {
      return NextResponse.json(
        { error: 'Não foi possível encontrar este endereço no mapa. Verifique os dados.' },
        { status: 400 }
      );
    }

    // 3. Calculate distance
    const routeInfo = await calculateDistance(origin, destination);
    
    if (!routeInfo) {
      return NextResponse.json(
        { error: 'Erro ao calcular rota até o seu endereço.' },
        { status: 500 }
      );
    }

    const { distanceKm } = routeInfo;
    const maxRadius = Number(settings.deliveryRadiusKm) || 10;

    // 4. Validate Delivery Radius
    if (distanceKm > maxRadius) {
      return NextResponse.json(
        { 
          error: `Desculpe, mas não realizamos pedidos em endereços com mais de ${maxRadius}km de distância da loja.`,
          distanceKm
        },
        { status: 400 }
      );
    }

    // 5. Calculate Fee
    const feePerKm = Number(settings.deliveryFeeKm) || 1.50;
    let deliveryFee = distanceKm * feePerKm;
    
    // Round to 2 decimal places
    deliveryFee = Math.round(deliveryFee * 100) / 100;

    return NextResponse.json({
      distanceKm,
      deliveryFee,
      lat: destination.lat,
      lng: destination.lng,
    });
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    return NextResponse.json(
      { error: 'Erro interno ao calcular o frete.' },
      { status: 500 }
    );
  }
}
