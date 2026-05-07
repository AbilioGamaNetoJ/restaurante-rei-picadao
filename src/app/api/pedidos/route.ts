import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { orders, orderItems, orderItemAddons } from '@/db/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const allOrders = await db.query.orders.findMany({
      where: status ? eq(orders.status, status as any) : undefined,
      with: {
        items: {
          with: {
            addons: true
          }
        }
      },
      orderBy: [desc(orders.createdAt)],
    });

    return NextResponse.json(allOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      addressStreet, 
      addressNumber, 
      addressComplement, 
      addressNeighborhood, 
      addressCity, 
      addressState, 
      addressZip,
      distanceKm,
      deliveryFee,
      subtotal,
      total,
      items // Array of items with products and addons
    } = body;

    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json({ error: 'Dados do pedido incompletos.' }, { status: 400 });
    }

    const newOrder = await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        customerName,
        customerEmail,
        customerPhone,
        addressStreet,
        addressNumber,
        addressComplement,
        addressNeighborhood,
        addressCity,
        addressState,
        addressZip,
        distanceKm,
        deliveryFee,
        subtotal,
        total,
        status: 'pending',
      }).returning();

      for (const item of items) {
        const [orderItem] = await tx.insert(orderItems).values({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          comment: item.comment,
          subtotal: item.subtotal,
        }).returning();

        if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
          await tx.insert(orderItemAddons).values(
            item.addons.map((addon: any) => ({
              orderItemId: orderItem.id,
              addonId: addon.addonId,
              addonName: addon.addonName,
              addonPrice: addon.addonPrice,
              quantity: addon.quantity,
            }))
          );
        }
      }

      return order;
    });

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pedido.' },
      { status: 500 }
    );
  }
}
