import * as React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { expenses, orders } from '@/db/schema';
import { FinanceiroClient } from './financeiro-client';
import { desc } from 'drizzle-orm';
import { can, getRoleFromClaims } from '@/lib/permissions';

export default async function FinanceiroPage() {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!userId || !can(role, 'view_finance')) {
    redirect('/dashboard');
  }

  // Fetch das despesas e talvez pedidos pagos para compor o fluxo de caixa
  const despesas = await db.select().from(expenses).orderBy(desc(expenses.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-muted-foreground">
          Gerencie despesas e visualize os relatórios financeiros.
        </p>
      </div>

      <FinanceiroClient initialExpenses={despesas} />
    </div>
  );
}
