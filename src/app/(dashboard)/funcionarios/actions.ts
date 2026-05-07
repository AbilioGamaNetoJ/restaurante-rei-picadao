'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

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
  await client.users.updateUserMetadata(targetUserId, {
    publicMetadata: {
      role: newRole,
    },
  });

  revalidatePath('/funcionarios');
}
