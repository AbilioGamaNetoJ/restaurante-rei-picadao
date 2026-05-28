'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { refundPayment, deletePayment } from '@/lib/asaas';

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

  if (newStatus === 'cancelled') {
    const currentOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId)
    });

    if (currentOrder && currentOrder.paymentId) {
      try {
        if (currentOrder.status === 'pending') {
          // Deletar cobrança pendente no Asaas
          await deletePayment(currentOrder.paymentId);
        } else if (['paid', 'preparing', 'ready', 'delivering'].includes(currentOrder.status)) {
          // Estornar pagamento já realizado no Asaas
          await refundPayment(currentOrder.paymentId);
        }
      } catch (err) {
        console.error("Falha ao comunicar com Asaas no cancelamento:", err);
        throw new Error('Falha ao processar cancelamento/estorno no Asaas. O pedido não foi cancelado localmente para evitar inconsistências.');
      }
    }
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
