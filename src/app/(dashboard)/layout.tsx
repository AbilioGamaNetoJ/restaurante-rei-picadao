import React from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { can } from '@/lib/permissions';
import { db } from '@/db';
import { users } from '@/db/schema';
import { DashboardLayoutClient } from './dashboard-layout-client';
import { PushPermission } from '@/components/pwa/push-permission';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  const user = await currentUser();
  const role = (sessionClaims?.metadata as { role?: string })?.role || 'cliente';

  // Se for apenas um cliente logado tentando acessar o painel, redireciona para a home
  if (!userId || !can(role, 'access_dashboard')) {
    redirect('/');
  }

  // Sincronizar usuário com o Banco de Dados
  if (user) {
    await db.insert(users).values({
      clerkId: user.id,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: role,
    }).onConflictDoUpdate({
      target: users.clerkId,
      set: { 
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: role,
        updatedAt: new Date()
      }
    });
  }



  // Buscar configurações da loja para o logo
  const settings = await db.query.storeSettings.findFirst();
  const logoUrl = settings?.logoUrl;
  const storeName = settings?.name || "Rei do Picadão";

  return (
    <DashboardLayoutClient 
      role={role} 
      logoUrl={logoUrl} 
      storeName={storeName}
    >
      {children}
      <PushPermission />
    </DashboardLayoutClient>
  );
}
