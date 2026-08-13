'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { products, productAddons, productCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { can, getRoleFromClaims } from '@/lib/permissions';

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
  try {
    const { userId, sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || !can(role, 'manage_products')) {
      throw new Error('Não autorizado');
    }

    const primaryCategoryId = data.categoryIds[0];
    if (!primaryCategoryId) {
      throw new Error('O produto deve ter pelo menos uma categoria.');
    }

    // Insere o produto
    const newProduct = await db.insert(products).values({
      name: data.name,
      categoryId: primaryCategoryId,
      description: data.description || null,
      price: data.price,
      costPrice: data.costPrice === '' ? null : data.costPrice, // Resolve erro de numeric
      imageUrl: data.imageUrl || null,
      sortOrder: data.sortOrder,
      servesPeople: data.servesPeople,
      originalPrice: data.originalPrice === '' ? null : data.originalPrice,
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
  } catch (error) {
    console.error('Erro no createProduct:', error);
    throw error;
  }
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
  try {
    const { userId, sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || !can(role, 'manage_products')) {
      throw new Error('Não autorizado');
    }

    const primaryCategoryId = data.categoryIds[0];
    if (!primaryCategoryId) {
      throw new Error('O produto deve ter pelo menos uma categoria.');
    }

    // Atualiza o produto
    await db
      .update(products)
      .set({
        name: data.name,
        categoryId: primaryCategoryId,
        description: data.description || null,
        price: data.price,
        costPrice: data.costPrice === '' ? null : data.costPrice,
        imageUrl: data.imageUrl || null,
        isAvailable: data.isAvailable,
        sortOrder: data.sortOrder,
        servesPeople: data.servesPeople,
        originalPrice: data.originalPrice === '' ? null : data.originalPrice,
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
  } catch (error) {
    console.error('Erro no updateProduct:', error);
    throw error;
  }
}

export async function deleteProduct(id: string) {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'manage_products')) {
    throw new Error('Não autorizado');
  }

  await db.delete(products).where(eq(products.id, id));

  revalidatePath('/produtos');
  revalidatePath('/');
}
