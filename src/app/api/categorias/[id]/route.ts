import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import slugify from 'slugify';
import { can, getRoleFromClaims } from '@/lib/permissions';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const { id } = await params;
    const role = getRoleFromClaims(sessionClaims);

    if (!userId || !can(role, 'manage_categories')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, type, sortOrder, isActive } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true, strict: true });
    }
    if (type) updateData.type = type;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    if (updatedCategory.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(updatedCategory[0]);
  } catch (error: any) {
    console.error('Error updating category:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao atualizar categoria.' },
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

    if (!userId || !can(role, 'manage_categories')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const deletedCategory = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();

    if (deletedCategory.length === 0) {
      return NextResponse.json({ error: 'Categoria não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Categoria excluída com sucesso.' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir categoria.' },
      { status: 500 }
    );
  }
}
