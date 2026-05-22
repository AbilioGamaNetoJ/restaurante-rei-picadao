import * as React from 'react';
import { clerkClient, auth } from '@clerk/nextjs/server';
import { FuncionariosClient } from './funcionarios-client';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function FuncionariosPage() {
  const { sessionClaims, userId } = await auth();
  const currentRole = (sessionClaims?.metadata as any)?.role;

  const client = await clerkClient();
  const clerkUsers = await client.users.getUserList();

  // Filtrar o próprio usuário para não aparecer na lista
  const filteredClerkUsers = clerkUsers.data.filter(user => user.id !== userId);

  // Buscar dados adicionais do banco
  const serializedUsers = await Promise.all(
    filteredClerkUsers.map(async (user) => {
      const dbUser = await db.query.users.findFirst({
        where: eq(users.clerkId, user.id),
      });

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
        role: user.publicMetadata?.role || 'cliente',
        // Dados extras do banco
        salary: dbUser?.salary,
        position: dbUser?.position,
        department: dbUser?.department,
        isActive: dbUser?.isActive ?? true,
        createdAt: dbUser?.createdAt,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Equipe</h2>
        <p className="text-muted-foreground">
          Gerencie os funcionários, salários, cargos e setores.
        </p>
      </div>

      <FuncionariosClient users={serializedUsers} currentRole={currentRole} />
    </div>
  );
}
