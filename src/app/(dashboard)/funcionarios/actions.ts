'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function updateUserRole(targetUserId: string, newRole: string) {
  const { userId, sessionClaims } = await auth();
  const currentRole = (sessionClaims?.metadata as any)?.role;

  if (!userId || (currentRole !== 'dono' && currentRole !== 'gerente')) {
    throw new Error('Não autorizado');
  }

  // Gerente só pode promover/rebaixar para funcionário
  if (currentRole === 'gerente' && (newRole === 'dono' || newRole === 'gerente')) {
    throw new Error('Gerente só pode criar funcionários');
  }

  const client = await clerkClient();

  // 1. Atualiza no Clerk
  const clerkUser = await client.users.getUser(targetUserId);
  await client.users.updateUserMetadata(targetUserId, {
    publicMetadata: {
      role: newRole,
    },
  });

  // 2. Sincroniza no Banco de Dados
  await db.insert(users).values({
    clerkId: targetUserId,
    email: clerkUser.emailAddresses[0].emailAddress,
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    role: newRole,
  }).onConflictDoUpdate({
    target: users.clerkId,
    set: {
      role: newRole,
      updatedAt: new Date()
    }
  });

  revalidatePath('/funcionarios');
}

export async function updateEmployee(clerkId: string, data: {
  salary?: string | null;
  position?: string | null;
  department?: string | null;
  isActive?: boolean;
}) {
  const { userId, sessionClaims } = await auth();
  const currentRole = (sessionClaims?.metadata as any)?.role;

  if (!userId || (currentRole !== 'dono' && currentRole !== 'gerente')) {
    throw new Error('Não autorizado');
  }

  const updateData: any = {
    updatedAt: new Date()
  };

  if (data.salary !== undefined) {
    updateData.salary = data.salary ? String(data.salary) : null;
  }
  if (data.position !== undefined) {
    updateData.position = data.position;
  }
  if (data.department !== undefined) {
    updateData.department = data.department;
  }
  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  await db.update(users)
    .set(updateData)
    .where(eq(users.clerkId, clerkId));

  revalidatePath('/funcionarios');
}

export async function deleteEmployee(clerkId: string) {
  const { userId, sessionClaims } = await auth();
  const currentRole = (sessionClaims?.metadata as any)?.role;

  if (!userId || currentRole !== 'dono') {
    throw new Error('Apenas o dono pode excluir funcionários');
  }

  const client = await clerkClient();

  // 1. Reseta role no Clerk para 'cliente'
  await client.users.updateUserMetadata(clerkId, {
    publicMetadata: {
      role: 'cliente',
    },
  });

  // 2. Remove do banco ou marca como inativo
  await db.update(users)
    .set({
      isActive: false,
      role: 'cliente',
      updatedAt: new Date()
    })
    .where(eq(users.clerkId, clerkId));

  revalidatePath('/funcionarios');
}
