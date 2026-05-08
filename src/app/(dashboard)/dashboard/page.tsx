import * as React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp, XCircle } from 'lucide-react';

export default async function DashboardPage() {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role;

  if (role !== 'dono') {
    redirect('/pedidos');
  }

  // Obter data de hoje e do início do mês
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Queries (Faturamento do dia, Mês, Pedidos totais, Cancelados)
  const [
    todayRevenueResult,
    monthRevenueResult,
    totalOrdersResult,
    cancelledOrdersResult,
  ] = await Promise.all([
    db
      .select({ total: sql<number>`sum(${orders.total})` })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'paid'),
          gte(orders.createdAt, startOfDay)
        )
      ),
    db
      .select({ total: sql<number>`sum(${orders.total})` })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'paid'),
          gte(orders.createdAt, startOfMonth)
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(gte(orders.createdAt, startOfMonth)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          eq(orders.status, 'cancelled'),
          gte(orders.createdAt, startOfMonth)
        )
      ),
  ]);

  const todayRevenue = Number(todayRevenueResult[0]?.total || 0);
  const monthRevenue = Number(monthRevenueResult[0]?.total || 0);
  const totalOrders = Number(totalOrdersResult[0]?.count || 0);
  const cancelledOrders = Number(cancelledOrdersResult[0]?.count || 0);
  const averageTicket = totalOrders > 0 ? monthRevenue / totalOrders : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do desempenho da loja.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento (Hoje)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(todayRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Totais (Mês)
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio (Mês)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageTicket)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cancelamentos (Mês)
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cancelledOrders}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
