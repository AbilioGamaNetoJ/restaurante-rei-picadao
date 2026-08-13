import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { isTrackingTokenValid } from '@/lib/order-tracking';

export async function getTrackableOrder(orderId: string, trackingToken: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order || !isTrackingTokenValid(trackingToken, order.trackingTokenHash, order.trackingTokenExpiresAt)) {
    return null;
  }

  return order;
}
