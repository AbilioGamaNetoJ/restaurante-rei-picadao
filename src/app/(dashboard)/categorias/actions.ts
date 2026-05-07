'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

export async function createCategory(data: { name: string; type: 'produto' | 'adicional'; sortOrder: number }) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;
  
  if (!userId || (role !== 'dono' && role !== 'gerente')) {
    throw new Error('Não autorizado');
  }

  await db.insert(categories).values({
    name: data.name,
    slug: generateSlug(data.name),
    type: data.type,
    sortOrder: data.sortOrder,
  });

  revalidatePath('/categorias');
}

export async function updateCategory(id: string, data: { name: string; type: 'produto' | 'adicional'; sortOrder: number; isActive: boolean }) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;
  
  if (!userId || (role !== 'dono' && role !== 'gerente')) {
    throw new Error('Não autorizado');
  }

  await db
    .update(categories)
    .set({
      name: data.name,
      slug: generateSlug(data.name),
      type: data.type,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      updatedAt: new Date()
    })
    .where(eq(categories.id, id));

  revalidatePath('/categorias');
}

export async function deleteCategory(id: string) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;
  
  if (!userId || (role !== 'dono' && role !== 'gerente')) {
    throw new Error('Não autorizado');
  }

  await db.delete(categories).where(eq(categories.id, id));

  revalidatePath('/categorias');
}
