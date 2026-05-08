'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { products, productAddons, productCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function createProduct(data: { 
  name: string; 
  categoryIds: string[]; 
  description: string; 
  price: string; 
  costPrice: string; 
  imageUrl: string; 
  sortOrder: number;
  addonsIds: string[];
  servesPeople?: number;
  originalPrice?: string;
  isFeatured?: boolean;
}) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;
  
  if (!userId || (role !== 'dono' && role !== 'gerente')) {
    throw new Error('Não autorizado');
  }

  // Insere o produto
  const newProduct = await db.insert(products).values({
    name: data.name,
    categoryId: data.categoryIds[0] || '', // Mantém o primeiro para compatibilidade temporária
    description: data.description,
    price: data.price,
    costPrice: data.costPrice,
    imageUrl: data.imageUrl,
    sortOrder: data.sortOrder,
    servesPeople: data.servesPeople,
    originalPrice: data.originalPrice,
    isFeatured: data.isFeatured || false,
  }).returning();

  // Insere as categorias vinculadas
  if (data.categoryIds.length > 0) {
    await db.insert(productCategories).values(
      data.categoryIds.map(categoryId => ({
        productId: newProduct[0].id,
        categoryId,
      }))
    );
  }

  // Insere os adicionais vinculados
  if (data.addonsIds.length > 0) {
    await db.insert(productAddons).values(
      data.addonsIds.map(addonId => ({
        productId: newProduct[0].id,
        addonId,
      }))
    );
  }

  revalidatePath('/produtos');
  revalidatePath('/'); // Revalida a loja também
}

export async function updateProduct(id: string, data: { 
  name: string; 
  categoryIds: string[]; 
  description: string; 
  price: string; 
  costPrice: string; 
  imageUrl: string; 
  isAvailable: boolean;
  sortOrder: number;
  addonsIds: string[];
  servesPeople?: number;
  originalPrice?: string;
  isFeatured?: boolean;
}) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;
  
  if (!userId || (role !== 'dono' && role !== 'gerente')) {
    throw new Error('Não autorizado');
  }

  // Atualiza o produto
  await db
    .update(products)
    .set({
      name: data.name,
      categoryId: data.categoryIds[0] || '', // Mantém o primeiro para compatibilidade temporária
      description: data.description,
      price: data.price,
      costPrice: data.costPrice,
      imageUrl: data.imageUrl,
      isAvailable: data.isAvailable,
      sortOrder: data.sortOrder,
      servesPeople: data.servesPeople,
      originalPrice: data.originalPrice,
      isFeatured: data.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  // Atualiza categorias: apaga todas e recria
  await db.delete(productCategories).where(eq(productCategories.productId, id));
  if (data.categoryIds.length > 0) {
    await db.insert(productCategories).values(
      data.categoryIds.map(categoryId => ({
        productId: id,
        categoryId,
      }))
    );
  }

  // Atualiza adicionais: apaga todos e recria
  await db.delete(productAddons).where(eq(productAddons.productId, id));
  if (data.addonsIds.length > 0) {
    await db.insert(productAddons).values(
      data.addonsIds.map(addonId => ({
        productId: id,
        addonId,
      }))
    );
  }

  revalidatePath('/produtos');
  revalidatePath('/');
}

export async function deleteProduct(id: string) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;
  
  if (!userId || (role !== 'dono' && role !== 'gerente')) {
    throw new Error('Não autorizado');
  }

  await db.delete(products).where(eq(products.id, id));

  revalidatePath('/produtos');
  revalidatePath('/');
}
