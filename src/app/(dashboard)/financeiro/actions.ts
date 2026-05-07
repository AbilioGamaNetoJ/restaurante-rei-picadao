'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/db';
import { expenses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createExpense(data: { description: string; amount: string; category: string }) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;
  
  if (!userId || role !== 'dono') {
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
  const role = (sessionClaims?.metadata as any)?.role;
  
  if (!userId || role !== 'dono') {
    throw new Error('Não autorizado');
  }

  await db.delete(expenses).where(eq(expenses.id, id));

  revalidatePath('/financeiro');
}
