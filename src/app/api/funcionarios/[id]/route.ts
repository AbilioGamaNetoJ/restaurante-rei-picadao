import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { can, getRoleFromClaims, isRole } from '@/lib/permissions';

const clerkUserIdSchema = z.string().regex(/^user_[A-Za-z0-9]+$/).max(128);

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId, sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims);
    const id = clerkUserIdSchema.safeParse((await params).id);
    if (!userId || !can(role, 'manage_staff')) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }
    if (!id.success || id.data === userId) {
      return NextResponse.json({ error: 'Funcionário inválido.' }, { status: 400 });
    }

    const client = await clerkClient();
    const targetUser = await client.users.getUser(id.data);
    const targetRole = (targetUser.publicMetadata as Record<string, unknown>).role;
    if (!isRole(targetRole) || targetRole === 'dono' || (role === 'gerente' && targetRole !== 'funcionario')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    await client.users.deleteUser(id.data);
    return NextResponse.json({ message: 'Funcionário excluído com sucesso.' });
  } catch (error) {
    console.error('Failed to delete employee', error);
    return NextResponse.json({ error: 'Erro ao excluir funcionário.' }, { status: 500 });
  }
}
