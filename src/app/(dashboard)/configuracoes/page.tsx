import * as React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { storeSettings, storeHours } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ConfiguracoesClient } from './configuracoes-client';
import { can, getRoleFromClaims } from '@/lib/permissions';

export default async function ConfiguracoesPage() {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'edit_settings')) {
    redirect('/dashboard');
  }

  // Fetch das configurações atuais
  const settings = await db.select().from(storeSettings).limit(1);
  const currentSettings = settings[0] || null;

  let currentHours: any[] = [];
  if (currentSettings) {
    currentHours = await db.select().from(storeHours).where(eq(storeHours.storeId, currentSettings.id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações da Loja</h1>
        <p className="text-muted-foreground">
          Gerencie os dados, endereço, taxas e horários de funcionamento do seu restaurante.
        </p>
      </div>

      <ConfiguracoesClient 
        initialSettings={currentSettings} 
        initialHours={currentHours} 
      />
    </div>
  );
}
