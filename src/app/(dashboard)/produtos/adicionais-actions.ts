'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { addons } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { can, getRoleFromClaims } from '@/lib/permissions';

export async function createAddon(data: { 
  name: string; 
  description?: string;
  price: string; 
  categoryId: string;
  imageUrl?: string;
  isAvailable?: boolean;
}) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'manage_products')) {
    throw new Error('Não autorizado');
  }

  await db.insert(addons).values({
    name: data.name,
    description: data.description,
    price: data.price,
    categoryId: data.categoryId,
    imageUrl: data.imageUrl,
    isAvailable: data.isAvailable ?? true,
  });

  revalidatePath('/produtos');
  revalidatePath('/'); // Revalida a loja também
}

export async function updateAddon(id: string, data: { 
  name: string; 
  description?: string;
  price: string; 
  categoryId: string;
  imageUrl?: string;
  isAvailable?: boolean;
}) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'manage_products')) {
    throw new Error('Não autorizado');
  }

  await db
    .update(addons)
    .set({
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable,
    })
    .where(eq(addons.id, id));

  revalidatePath('/produtos');
  revalidatePath('/');
}

export async function deleteAddon(id: string) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'manage_products')) {
    throw new Error('Não autorizado');
  }

  await db.delete(addons).where(eq(addons.id, id));

  revalidatePath('/produtos');
  revalidatePath('/');
}
