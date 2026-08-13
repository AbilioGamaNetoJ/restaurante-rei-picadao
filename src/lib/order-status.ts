import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { deletePayment, refundPayment } from '@/lib/asaas';

export const orderStatusSchema = z.enum([
  'pending',
  'paid',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'cancelled',
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

const staffTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: [],
  paid: ['preparing'],
  preparing: ['ready'],
  ready: ['delivering'],
  delivering: ['delivered'],
  delivered: [],
  cancelled: [],
};

const cancellableStatuses: ReadonlySet<OrderStatus> = new Set([
  'pending',
  'paid',
  'preparing',
  'ready',
  'delivering',
]);

export class OrderStatusError extends Error {}

async function ensureCancellable(
  currentOrder: { status: OrderStatus; paymentId: string | null },
  canCancel: boolean,
  orderId: string
) {
  if (!canCancel || !cancellableStatuses.has(currentOrder.status)) {
    throw new OrderStatusError('Transição de status não permitida.');
  }

  if (!currentOrder.paymentId) return;

  try {
    if (currentOrder.status === 'pending') {
      await deletePayment(currentOrder.paymentId);
    } else {
      await refundPayment(currentOrder.paymentId);
    }
  } catch {
    console.error('Failed to cancel or refund payment for order', { orderId });
    throw new OrderStatusError('Não foi possível cancelar o pagamento com segurança.');
  }
}

export async function transitionStaffOrder(
  orderId: string,
  nextStatus: OrderStatus,
  canCancel: boolean
) {
  const currentOrder = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!currentOrder) throw new OrderStatusError('Pedido não encontrado.');
  if (currentOrder.status === nextStatus) return currentOrder;

  if (nextStatus === 'cancelled') {
    await ensureCancellable(currentOrder, canCancel, orderId);
  } else if (!staffTransitions[currentOrder.status].includes(nextStatus)) {
    throw new OrderStatusError('Transição de status não permitida.');
  }

  const [updatedOrder] = await db
    .update(orders)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.status, currentOrder.status)))
    .returning();

  if (!updatedOrder) {
    throw new OrderStatusError('O pedido foi alterado por outro usuário. Atualize a página e tente novamente.');
  }

  return updatedOrder;
}
