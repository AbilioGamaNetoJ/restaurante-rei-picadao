import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { asc, desc } from 'drizzle-orm';
import slugify from 'slugify';

export async function GET() {
  try {
    const allCategories = await db.query.categories.findMany({
      where: (categories, { eq }) => eq(categories.isActive, true),
      orderBy: [asc(categories.sortOrder)],
    });

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias.' },
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
    const { name, type, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: 'O nome é obrigatório.' }, { status: 400 });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const newCategory = await db.insert(categories).values({
      name,
      slug,
      type: type || 'produto',
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();

    return NextResponse.json(newCategory[0]);
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao criar categoria.' },
      { status: 500 }
    );
  }
}
