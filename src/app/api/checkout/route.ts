import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, orderItemAddons } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createAsaasCustomer, createCheckout } from '@/lib/asaas';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, checkoutData, subtotal, deliveryFee, total } = body;

    if (!items || items.length === 0 || !checkoutData) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    // 1. Create or get Customer in Asaas
    const customer = await createAsaasCustomer(
      checkoutData.customerName,
      checkoutData.customerEmail,
      checkoutData.customerPhone,
      checkoutData.customerCpfCnpj
    );

    if (!customer) {
      return NextResponse.json({ error: 'Erro ao registrar cliente no gateway de pagamento.' }, { status: 500 });
    }

    // 2. Save order to database (neon-http does not support transactions)
    const [insertedOrder] = await db.insert(orders).values({
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
    }).returning({ id: orders.id });

    const orderId = insertedOrder.id;

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

    const newOrder = insertedOrder;

    // 3. Create Checkout Link in Asaas
    const description = `Pedido #${newOrder.id.split('-')[0].toUpperCase()} - Rei do Picadão`;
    const checkoutUrl = await createCheckout(
      newOrder.id,
      customer!.id,
      total,
      description
    );

    // 4. Update Order with Checkout URL
    await db.update(orders)
      .set({ asaasCheckoutUrl: checkoutUrl })
      .where(eq(orders.id, newOrder.id));

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
