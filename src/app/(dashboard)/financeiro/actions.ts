'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { can, getRoleFromClaims } from '@/lib/permissions';

export async function createExpense(data: { description: string; amount: string; category: string }) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'manage_finance')) {
    throw new Error('Não autorizado');
  }

  const user = await currentUser();

  await db.insert(expenses).values({
    description: data.description,
    amount: data.amount,
    category: data.category,
    createdBy: user?.firstName || 'Dono',
  });

  revalidatePath('/financeiro');
}

export async function deleteExpense(id: string) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'manage_finance')) {
    throw new Error('Não autorizado');
  }

  await db.delete(expenses).where(eq(expenses.id, id));

  revalidatePath('/financeiro');
}

export async function updateExpense(id: string, data: { description?: string; amount?: string; category?: string }) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'manage_finance')) {
    throw new Error('Não autorizado');
  }

  const updateData: any = {};
  if (data.description !== undefined) updateData.description = data.description;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.category !== undefined) updateData.category = data.category;

  await db.update(expenses)
    .set(updateData)
    .where(eq(expenses.id, id));

  revalidatePath('/financeiro');
  revalidatePath('/dashboard');
}
