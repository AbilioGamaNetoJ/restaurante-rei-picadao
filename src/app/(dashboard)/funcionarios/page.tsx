import { clerkClient, auth } from '@clerk/nextjs/server';
import { FuncionariosClient } from './funcionarios-client';

export default async function FuncionariosPage() {
  const { sessionClaims } = await auth();
  const currentRole = (sessionClaims?.metadata as any)?.role;

  const client = await clerkClient();
  const users = await client.users.getUserList();

  const serializedUsers = users.data.map(user => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress,
    imageUrl: user.imageUrl,
    role: user.publicMetadata?.role || 'cliente', // quem se cadastra sem role é apenas 'cliente' por default
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Equipe</h2>
        <p className="text-muted-foreground">
          Gerencie os funcionários e seus níveis de acesso.
        </p>
      </div>

      <FuncionariosClient users={serializedUsers} currentRole={currentRole} />
    </div>
  );
}
