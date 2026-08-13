'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { can, getRoleFromClaims, Role } from '@/lib/permissions';

const clerkUserIdSchema = z.string().regex(/^user_[A-Za-z0-9]+$/).max(128);
const staffRoleSchema = z.enum(['gerente', 'funcionario', 'cliente']);

function getClerkUserRole(publicMetadata: unknown): Role {
  const role = getRoleFromClaims({ metadata: publicMetadata });
  return role ?? 'cliente';
}

async function getAuthorizedStaffManager() {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);
  if (!userId || !can(role, 'manage_staff')) {
    throw new Error('Não autorizado');
  }

  return { userId, role };
}

export async function updateUserRole(targetUserId: string, newRole: string) {
  const { userId, role: currentRole } = await getAuthorizedStaffManager();
  const id = clerkUserIdSchema.safeParse(targetUserId);
  const targetRole = staffRoleSchema.safeParse(newRole);
  if (!id.success || !targetRole.success || targetUserId === userId) {
    throw new Error('Dados de funcionário inválidos');
  }

  const client = await clerkClient();

  const clerkUser = await client.users.getUser(targetUserId);
  const currentTargetRole = getClerkUserRole(clerkUser.publicMetadata);

  if (currentTargetRole === 'dono') {
    throw new Error('A função do dono não pode ser alterada por esta tela');
  }
  if (currentRole === 'gerente' && (currentTargetRole !== 'funcionario' || targetRole.data === 'gerente')) {
    throw new Error('Gerentes só podem gerenciar funcionários');
  }

  // 1. Atualiza no Clerk
  await client.users.updateUserMetadata(targetUserId, {
    publicMetadata: {
      role: targetRole.data,
    },
  });

  // 2. Sincroniza no Banco de Dados
  await db.insert(users).values({
    clerkId: targetUserId,
    email: clerkUser.emailAddresses[0].emailAddress,
    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    role: targetRole.data,
  }).onConflictDoUpdate({
    target: users.clerkId,
    set: {
      role: targetRole.data,
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
  const { role: currentRole } = await getAuthorizedStaffManager();
  if (!clerkUserIdSchema.safeParse(clerkId).success) throw new Error('Funcionário inválido');

  if (currentRole === 'gerente') {
    const client = await clerkClient();
    const target = await client.users.getUser(clerkId);
    if (getClerkUserRole(target.publicMetadata) !== 'funcionario') {
      throw new Error('Gerentes só podem gerenciar funcionários');
    }
  }

  const updateData: {
    updatedAt: Date;
    salary?: string | null;
    position?: string | null;
    department?: string | null;
    isActive?: boolean;
  } = {
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
  const { userId, role } = await getAuthorizedStaffManager();
  if (role !== 'dono' || !clerkUserIdSchema.safeParse(clerkId).success || clerkId === userId) {
    throw new Error('Apenas o dono pode excluir funcionários');
  }

  const client = await clerkClient();
  const target = await client.users.getUser(clerkId);
  if (getClerkUserRole(target.publicMetadata) === 'dono') {
    throw new Error('A função do dono não pode ser alterada por esta tela');
  }

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
