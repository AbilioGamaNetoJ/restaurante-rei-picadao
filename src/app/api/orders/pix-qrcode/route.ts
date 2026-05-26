import { NextResponse } from 'next/server';
import { getPaymentByExternalReference } from '@/lib/asaas';

const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ASAAS_API_KEY not configured' }, { status: 500 });
    }

    // 1. Get Asaas Payment ID from our orderId (externalReference)
    const asaasPayment = await getPaymentByExternalReference(orderId);

    // If it's not found or it's not a PIX payment, return null safely
    if (!asaasPayment || asaasPayment.billingType !== 'PIX') {
      return NextResponse.json({ qrCode: null });
    }

    // 2. Fetch the PIX QR Code from Asaas API
    const res = await fetch(`${ASAAS_API_URL}/payments/${asaasPayment.id}/pixQrCode`, {
      method: 'GET',
      headers: {
        'access_token': apiKey,
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error('[pix-qrcode] Error fetching QR Code from Asaas:', await res.text());
      return NextResponse.json({ qrCode: null });
    }

    const qrCodeData = await res.json();

    return NextResponse.json({ qrCode: qrCodeData });
  } catch (error) {
    console.error('[pix-qrcode] Exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
