'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { can, getRoleFromClaims } from '@/lib/permissions';
import { orderStatusSchema, transitionStaffOrder } from '@/lib/order-status';

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);
  
  if (!userId || !can(role, 'manage_orders')) {
    throw new Error('Não autorizado');
  }

  const parsedStatus = orderStatusSchema.safeParse(newStatus);
  if (!parsedStatus.success) {
    throw new Error('Status inválido');
  }

  await transitionStaffOrder(orderId, parsedStatus.data, can(role, 'cancel_orders'));

  revalidatePath('/pedidos');
  revalidatePath('/dashboard');
}

export async function deleteOrder(orderId: string) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);
  
  if (!userId || !can(role, 'delete_orders')) {
    throw new Error('Não autorizado');
  }

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.status !== 'cancelled') {
    throw new Error('Apenas pedidos cancelados podem ser excluídos');
  }

  await db
    .delete(orders)
    .where(eq(orders.id, orderId));

  revalidatePath('/pedidos');
  revalidatePath('/dashboard');
}
