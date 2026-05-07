import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { products, productAddons, productCategories } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const isAvailable = searchParams.get('isAvailable');

    const filters = [];
    if (isAvailable === 'true') filters.push(eq(products.isAvailable, true));

    const allProducts = await db.query.products.findMany({
      where: filters.length > 0 ? and(...filters) : undefined,
      with: {
        categories: {
          with: {
            category: true
          }
        },
        addons: {
          with: {
            addon: true
          }
        }
      },
      orderBy: [asc(products.sortOrder)],
    });

    // Se categoryId estiver presente, filtramos no código ou via join mais complexo
    // Para simplificar e manter performance razoável com poucos dados, filtramos aqui:
    const filteredProducts = categoryId 
      ? allProducts.filter(p => p.categories.some(c => c.categoryId === categoryId))
      : allProducts;

    return NextResponse.json(filteredProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as any)?.role;
    if (role !== 'dono' && role !== 'gerente') {
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

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0 || !name || !price) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes.' }, { status: 400 });
    }

    const newProduct = await db.transaction(async (tx) => {
      const [product] = await tx.insert(products).values({
        categoryId: categoryIds[0], // Para compatibilidade
        name,
        description,
        price,
        costPrice,
        imageUrl,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        sortOrder: sortOrder || 0,
      }).returning();

      // Insere categorias
      await tx.insert(productCategories).values(
        categoryIds.map((categoryId: string) => ({
          productId: product.id,
          categoryId,
        }))
      );

      if (addonsIds && Array.isArray(addonsIds) && addonsIds.length > 0) {
        await tx.insert(productAddons).values(
          addonsIds.map((addonId: string) => ({
            productId: product.id,
            addonId,
          }))
        );
      }

      return product;
    });

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Erro ao criar produto.' },
      { status: 500 }
    );
  }
}
