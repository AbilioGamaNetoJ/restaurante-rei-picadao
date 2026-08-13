import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { products, productAddons, productCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { publicProductColumns, toPublicProduct } from '@/lib/public-catalog';
import { can, getRoleFromClaims } from '@/lib/permissions';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      columns: publicProductColumns,
      with: {
        categories: {
          columns: { categoryId: true },
        },
        addons: {
          with: {
            addon: {
              columns: { id: true, name: true, price: true, imageUrl: true },
              with: { category: { columns: { id: true, name: true } } },
            }
          }
        }
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(toPublicProduct(product));
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const { id } = await params;
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || !can(role, 'manage_products')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      categoryIds, // Array de IDs de categorias
      name, 
      description, 
      price, 
      costPrice, 
      imageUrl, 
      isAvailable, 
      sortOrder,
      addonsIds 
    } = body;

    const updatedProduct = await db.transaction(async (tx) => {
      const [product] = await tx.update(products)
        .set({
          categoryId: categoryIds?.[0] || null, // Para compatibilidade
          name,
          description,
          price,
          costPrice,
          imageUrl,
          isAvailable,
          sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      if (!product) {
        tx.rollback();
        return null;
      }

      // Update categories: remove old ones and insert new ones
      if (categoryIds && Array.isArray(categoryIds)) {
        await tx.delete(productCategories).where(eq(productCategories.productId, id));
        
        if (categoryIds.length > 0) {
          await tx.insert(productCategories).values(
            categoryIds.map((categoryId: string) => ({
              productId: id,
              categoryId,
            }))
          );
        }
      }

      // Update addons: remove old ones and insert new ones
      if (addonsIds && Array.isArray(addonsIds)) {
        await tx.delete(productAddons).where(eq(productAddons.productId, id));
        
        if (addonsIds.length > 0) {
          await tx.insert(productAddons).values(
            addonsIds.map((addonId: string) => ({
              productId: id,
              addonId,
            }))
          );
        }
      }

      return product;
    });

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar produto.' },
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

    if (!userId || !can(role, 'manage_products')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const deletedProduct = await db.delete(products)
      .where(eq(products.id, id))
      .returning();

    if (deletedProduct.length === 0) {
      return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Produto excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir produto.' },
      { status: 500 }
    );
  }
}
