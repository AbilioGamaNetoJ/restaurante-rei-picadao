'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getTrackableOrder } from '@/lib/order-access';

const confirmDeliverySchema = z.object({
  orderId: z.string().uuid(),
  trackingToken: z.string().min(32).max(256),
});

export async function confirmOrderDelivery(orderId: string, trackingToken: string) {
  const input = confirmDeliverySchema.safeParse({ orderId, trackingToken });
  if (!input.success) return { success: false };

  try {
    const order = await getTrackableOrder(input.data.orderId, input.data.trackingToken);
    if (order?.status !== 'delivering') return { success: false };

    const [updatedOrder] = await db
      .update(orders)
      .set({ status: 'delivered', updatedAt: new Date() })
      .where(and(eq(orders.id, order.id), eq(orders.status, 'delivering')))
      .returning({ id: orders.id });

    if (!updatedOrder) return { success: false };

    revalidatePath('/dashboard');
    revalidatePath('/pedidos');
    return { success: true };
  } catch (error) {
    console.error('Error confirming delivery:', error);
    return { success: false };
  }
}
