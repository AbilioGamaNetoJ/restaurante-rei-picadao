import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, orderItemAddons } from '@/db/schema';
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
      checkoutData.customerPhone
    );

    if (!customer) {
      return NextResponse.json({ error: 'Erro ao registrar cliente no gateway de pagamento.' }, { status: 500 });
    }

    // 2. Start Database Transaction to save order
    const newOrder = await db.transaction(async (tx) => {
      // Insert Order
      const [insertedOrder] = await tx.insert(orders).values({
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
        distanceKm: checkoutData.distanceKm.toString(),
        deliveryFee: deliveryFee.toString(),
        subtotal: subtotal.toString(),
        total: total.toString(),
        status: 'pending',
      }).returning({ id: orders.id });

      const orderId = insertedOrder.id;

      // Insert Items and Addons
      for (const item of items) {
        const [insertedItem] = await tx.insert(orderItems).values({
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
          
          await tx.insert(orderItemAddons).values(addonsToInsert);
        }
      }

      return insertedOrder;
    });

    // 3. Create Checkout Link in Asaas
    const description = `Pedido #${newOrder.id.split('-')[0].toUpperCase()} - Rei do Picadão`;
    const checkoutUrl = await createCheckout(
      newOrder.id,
      customer.id,
      total,
      description
    );

    if (!checkoutUrl) {
      // Falha ao gerar o link, mas o pedido já foi salvo no DB como pendente
      return NextResponse.json({ error: 'Erro ao gerar link de pagamento.' }, { status: 500 });
    }

    // 4. Update Order with Checkout URL
    await db.update(orders)
      .set({ asaasCheckoutUrl: checkoutUrl })
      .where({ id: newOrder.id });

    return NextResponse.json({ checkoutUrl });

  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o pedido.' }, { status: 500 });
  }
}
