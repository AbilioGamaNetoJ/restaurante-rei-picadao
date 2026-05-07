import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: {
          with: {
            addons: true
          }
        }
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedido.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    // Role check for status updates (usually Gerente/Dono/Funcionario)
    const role = (sessionClaims?.metadata as any)?.role;
    if (!role || role === 'cliente') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório.' }, { status: 400 });
    }

    const updatedOrder = await db.update(orders)
      .set({ 
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (updatedOrder.length === 0) {
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do pedido.' },
      { status: 500 }
    );
  }
}
