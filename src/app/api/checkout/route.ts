import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, orderItemAddons } from '@/db/schema';
import { eq, or, and, notInArray } from 'drizzle-orm';
import { createAsaasCustomer, createCheckout } from '@/lib/asaas';
import crypto from 'crypto';
import { z } from 'zod';

const checkoutSchema = z.object({
  items: z.array(z.any()).min(1),
  subtotal: z.number(),
  deliveryFee: z.number(),
  total: z.number(),
  checkoutData: z.object({
    customerName: z.string().min(3),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(10), // Expected to be cleaned numbers already
    customerCpfCnpj: z.string().min(11), // Expected to be cleaned numbers already
    addressStreet: z.string().min(3),
    addressNumber: z.string().min(1),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().min(2),
    addressCity: z.string().min(2),
    addressState: z.string().length(2),
    addressZip: z.string().length(8),
    distanceKm: z.number().optional(),
  }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validation = checkoutSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados de checkout inválidos.', details: validation.error.format() }, { status: 400 });
    }

    const { items, checkoutData, subtotal, deliveryFee, total } = validation.data;

    // 1. Check for existing active orders
    const activeOrder = await db.query.orders.findFirst({
      where: (orders, { and, or, eq, notInArray }) => and(
        or(
          eq(orders.customerEmail, checkoutData.customerEmail),
          eq(orders.customerPhone, checkoutData.customerPhone)
        ),
        notInArray(orders.status, ['delivered', 'cancelled'])
      ),
    });

    if (activeOrder) {
      return NextResponse.json({ 
        error: 'Você já possui um pedido em andamento. Aguarde a conclusão ou cancelamento para realizar outro.' 
      }, { status: 400 });
    }

    // 2. Generate Order ID upfront
    const orderId = crypto.randomUUID();

    // 3. Create or get Customer in Asaas
    const customer = await createAsaasCustomer(
      checkoutData.customerName,
      checkoutData.customerEmail,
      checkoutData.customerPhone,
      checkoutData.customerCpfCnpj
    );

    if (!customer) {
      return NextResponse.json({ error: 'Erro ao registrar cliente no gateway de pagamento.' }, { status: 500 });
    }

    // 4. Create Checkout Link in Asaas first
    const description = `Pedido #${orderId.split('-')[0].toUpperCase()} - Rei do Picadão`;
    const checkoutUrl = await createCheckout(
      orderId,
      customer.id,
      total,
      description
    );

    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Erro ao gerar link de pagamento no Asaas.' }, { status: 500 });
    }

    // 5. Save order to database (neon-http does not support transactions)
    await db.insert(orders).values({
      id: orderId,
      customerName: checkoutData.customerName,
      customerEmail: checkoutData.customerEmail,
      customerPhone: checkoutData.customerPhone,
      addressStreet: checkoutData.addressStreet,
      addressNumber: checkoutData.addressNumber,
      addressComplement: checkoutData.addressComplement,
      addressNeighborhood: checkoutData.addressNeighborhood,
      addressCity: checkoutData.addressCity,
      addressState: checkoutData.addressState,
      addressZip: checkoutData.addressZip,
      distanceKm: (checkoutData.distanceKm ?? 0).toString(),
      deliveryFee: (deliveryFee ?? 0).toString(),
      subtotal: (subtotal ?? 0).toString(),
      total: (total ?? 0).toString(),
      status: 'pending',
      asaasCheckoutUrl: checkoutUrl,
    });

    // Insert Items and Addons
    for (const item of items) {
      const [insertedItem] = await db.insert(orderItems).values({
        orderId,
        productId: item.productId,
        productName: item.name,
        productPrice: item.price.toString(),
        quantity: item.quantity,
        comment: item.comment,
        subtotal: item.subtotal.toString(),
      }).returning({ id: orderItems.id });

      const orderItemId = insertedItem.id;

      if (item.addons && item.addons.length > 0) {
        const addonsToInsert = item.addons.map((addon: any) => ({
          orderItemId,
          addonId: addon.id,
          addonName: addon.name,
          addonPrice: addon.price.toString(),
          quantity: addon.quantity,
        }));
        
        await db.insert(orderItemAddons).values(addonsToInsert);
      }
    }

    return NextResponse.json({ checkoutUrl });

  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ 
      error: 'Erro interno ao processar o pedido.',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
