'use server';

import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getOrderStatus(orderId: string) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        status: true,
      }
    });
    
    return order?.status || null;
  } catch (error) {
    console.error('Error fetching order status:', error);
    return null;
  }
}

export async function confirmOrderDelivery(orderId: string) {
  try {
    await db.update(orders)
      .set({ status: 'delivered' })
      .where(eq(orders.id, orderId));
      
    revalidatePath('/dashboard');
    revalidatePath('/pedidos');
    revalidatePath(`/checkout/confirmacao`);
    
    return { success: true };
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return { success: false, error: 'Erro ao confirmar entrega' };
  }
}
