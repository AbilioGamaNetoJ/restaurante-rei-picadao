import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, sessionClaims } = await auth();
    const { id } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const currentUserRole = (sessionClaims?.metadata as any)?.role;
    if (currentUserRole !== 'dono' && currentUserRole !== 'gerente') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const client = await clerkClient();
    
    // Check target user role before deletion
    const targetUser = await client.users.getUser(id);
    const targetRole = (targetUser.publicMetadata as any)?.role;

    // Restriction: Managers can only delete 'funcionario'
    if (currentUserRole === 'gerente' && targetRole !== 'funcionario') {
      return NextResponse.json(
        { error: 'Gerentes só podem excluir funcionários.' },
        { status: 403 }
      );
    }

    // Restriction: Cannot delete self
    if (id === userId) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta.' }, { status: 400 });
    }

    await client.users.deleteUser(id);

    return NextResponse.json({ message: 'Funcionário excluído com sucesso.' });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir funcionário.' },
      { status: 500 }
    );
  }
}
