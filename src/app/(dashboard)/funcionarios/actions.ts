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

