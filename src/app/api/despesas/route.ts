import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { can, getRoleFromClaims } from '@/lib/permissions';

export async function GET(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || !can(role, 'view_finance')) {
      return NextResponse.json({ error: 'Acesso exclusivo para o dono.' }, { status: 403 });
    }

    const allExpenses = await db.query.expenses.findMany({
      orderBy: [desc(expenses.createdAt)],
    });

    return NextResponse.json(allExpenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar despesas.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || !can(role, 'manage_finance')) {
      return NextResponse.json({ error: 'Acesso exclusivo para o dono.' }, { status: 403 });
    }

    const body = await req.json();
    const { description, amount, category } = body;

    if (!description || !amount || !category) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 });
    }

    const [newExpense] = await db.insert(expenses).values({
      description,
      amount,
      category,
      createdBy: userId,
    }).returning();

    return NextResponse.json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Erro ao criar despesa.' },
      { status: 500 }
    );
  }
}
