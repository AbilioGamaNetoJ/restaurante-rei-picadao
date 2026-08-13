import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { can, getRoleFromClaims } from '@/lib/permissions';
import { orderStatusSchema } from '@/lib/order-status';

const querySchema = z.object({ status: orderStatusSchema.optional() });

export async function GET(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims);
    if (!userId || !can(role, 'view_orders')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const params = Object.fromEntries(new URL(req.url).searchParams);
    const query = querySchema.safeParse(params);
    if (!query.success) {
      return NextResponse.json({ error: 'Filtro inválido.' }, { status: 400 });
    }

    const allOrders = await db.query.orders.findMany({
      where: query.data.status ? eq(orders.status, query.data.status) : undefined,
      with: {
        items: {
          with: {
            product: { columns: { imageUrl: true } },
            addons: true,
          },
        },
      },
      orderBy: [desc(orders.createdAt)],
    });

    return NextResponse.json(allOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedidos.' }, { status: 500 });
  }
}
