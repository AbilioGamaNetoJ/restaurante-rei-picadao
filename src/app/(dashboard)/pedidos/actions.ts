'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Não autorizado');
  }

  // Apenas validando se o status é válido pelo enum
  const validStatuses = ['pending', 'paid', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'] as const;
  
  if (!validStatuses.includes(newStatus as any)) {
    throw new Error('Status inválido');
  }

  await db
    .update(orders)
    .set({ status: newStatus as any, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  revalidatePath('/pedidos');
  revalidatePath('/dashboard');
}

export async function deleteOrder(orderId: string) {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Não autorizado');
  }

  await db
    .delete(orders)
    .where(eq(orders.id, orderId));

  revalidatePath('/pedidos');
  revalidatePath('/dashboard');
}
