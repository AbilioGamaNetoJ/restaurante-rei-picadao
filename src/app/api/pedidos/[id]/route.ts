import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { can, getRoleFromClaims } from '@/lib/permissions';
import { orderStatusSchema, transitionStaffOrder } from '@/lib/order-status';

const idSchema = z.string().uuid();
const patchSchema = z.object({ status: orderStatusSchema });

async function getStaffRole() {
  const { userId, sessionClaims } = await auth();
  return { userId, role: getRoleFromClaims(sessionClaims) };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getStaffRole();
    if (!userId || !can(role, 'view_orders')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const id = idSchema.safeParse((await params).id);
    if (!id.success) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id.data),
      with: { items: { with: { addons: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Erro ao buscar pedido.' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, role } = await getStaffRole();
    if (!userId || !can(role, 'manage_orders')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const id = idSchema.safeParse((await params).id);
    const body = patchSchema.safeParse(await req.json());
    if (!id.success || !body.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const order = await transitionStaffOrder(id.data, body.data.status, can(role, 'cancel_orders'));
    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Pedido não encontrado')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message.includes('não permitida')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status do pedido.' }, { status: 500 });
  }
}
