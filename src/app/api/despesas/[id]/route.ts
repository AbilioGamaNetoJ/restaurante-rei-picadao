import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { can, getRoleFromClaims } from '@/lib/permissions';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const { id } = await params;
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || !can(role, 'manage_finance')) {
      return NextResponse.json({ error: 'Acesso exclusivo para o dono.' }, { status: 403 });
    }

    const body = await req.json();
    const { description, amount, category } = body;

    const [updatedExpense] = await db.update(expenses)
      .set({
        description,
        amount,
        category,
      })
      .where(eq(expenses.id, id))
      .returning();

    if (!updatedExpense) {
      return NextResponse.json({ error: 'Despesa não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar despesa.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const { id } = await params;
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || !can(role, 'manage_finance')) {
      return NextResponse.json({ error: 'Acesso exclusivo para o dono.' }, { status: 403 });
    }

    const deletedExpense = await db.delete(expenses)
      .where(eq(expenses.id, id))
      .returning();

    if (deletedExpense.length === 0) {
      return NextResponse.json({ error: 'Despesa não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Despesa excluída com sucesso.' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir despesa.' },
      { status: 500 }
    );
  }
}
