import * as React from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { orders, users, products, expenses } from '@/db/schema';
import { eq, sql, and, gte, lte, inArray } from 'drizzle-orm';
import { DashboardClient } from './dashboard-client';
import { can, getRoleFromClaims } from '@/lib/permissions';

export default async function DashboardPage(props: {
  searchParams: Promise<{ month?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims);

  if (!can(role, 'view_metrics')) {
    redirect('/pedidos');
  }

  // Parse selected month from query param or use current month
  const now = new Date();
  let selectedMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12, 0, 0);
  if (searchParams.month) {
    const [year, month] = searchParams.month.split('-').map(Number);
    selectedMonth = new Date(year, month - 1, 1, 12, 0, 0);
  }

  const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
  const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0, 23, 59, 59);

  // Helper to get month start for past months
  const getMonthStart = (monthsAgo: number) => {
    const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - monthsAgo, 1, 12, 0, 0);
    return d;
  };

  const startOf12MonthsAgo = getMonthStart(11);

  // Revenue, Expenses, and Orders by month (last 12 months)
  const monthlyData = await db
    .select({
      month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
      revenue: sql<number>`sum(CASE WHEN ${orders.status} IN ('paid', 'preparing', 'ready', 'delivering', 'delivered') THEN ${orders.total} ELSE 0 END)`,
      orderCount: sql<number>`count(*)`,
    })
    .from(orders)
    .where(gte(orders.createdAt, startOf12MonthsAgo))
    .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

  // Monthly expenses (including salaries)
  const monthlyExpenses = await db
    .select({
      month: sql<string>`to_char(${expenses.createdAt}, 'YYYY-MM')`,
      amount: sql<number>`sum(${expenses.amount})`,
    })
    .from(expenses)
    .where(gte(expenses.createdAt, startOf12MonthsAgo))
    .groupBy(sql`to_char(${expenses.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${expenses.createdAt}, 'YYYY-MM')`);

  // Active employees and their salaries
  const activeEmployees = await db
    .select({
      salary: users.salary,
    })
    .from(users)
    .where(
      and(
        inArray(users.role, ['funcionario', 'gerente', 'dono']),
        eq(users.isActive, true)
      )
    );

  const totalMonthlySalaries = activeEmployees.reduce(
    (sum, emp) => sum + Number(emp.salary || 0),
    0
  );

  // Current month data
  const [
    monthRevenueResult,
    monthExpensesResult,
    totalOrdersResult,
    activeEmployeesCount,
    totalProducts,
  ] = await Promise.all([
    // Revenue this month
    db
      .select({ total: sql<number>`sum(${orders.total})` })
      .from(orders)
      .where(
        and(
          inArray(orders.status, ['paid', 'preparing', 'ready', 'delivering', 'delivered']),
          gte(orders.createdAt, startOfMonth),
          lte(orders.createdAt, endOfMonth)
        )
      ),
    // Expenses this month (registered + salaries)
    db
      .select({ total: sql<number>`sum(${expenses.amount})` })
      .from(expenses)
      .where(
        and(
          gte(expenses.createdAt, startOfMonth),
          lte(expenses.createdAt, endOfMonth)
        )
      ),
    // Total orders this month
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfMonth),
          lte(orders.createdAt, endOfMonth)
        )
      ),
    // Active employees count
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(
        and(
          inArray(users.role, ['funcionario', 'gerente', 'dono']),
          eq(users.isActive, true)
        )
      ),
    // Total products
    db.select({ count: sql<number>`count(*)` }).from(products),
  ]);

  const monthRevenue = Number(monthRevenueResult[0]?.total || 0);
  const monthExpenses = Number(monthExpensesResult[0]?.total || 0) + totalMonthlySalaries;
  const operatingBalance = monthRevenue - monthExpenses;
  const totalOrders = Number(totalOrdersResult[0]?.count || 0);
  const activeEmployeesCountNum = Number(activeEmployeesCount[0]?.count || 0);
  const totalProductsNum = Number(totalProducts[0]?.count || 0);

  // Calculate capital total (historical revenue - historical expenses)
  const [totalHistoricalRevenue, totalHistoricalExpenses] = await Promise.all([
    db
      .select({ total: sql<number>`sum(${orders.total})` })
      .from(orders)
      .where(inArray(orders.status, ['paid', 'preparing', 'ready', 'delivering', 'delivered'])),
    db
      .select({ total: sql<number>`sum(${expenses.amount})` })
      .from(expenses),
  ]);

  const totalHistoricalRevenueNum = Number(totalHistoricalRevenue[0]?.total || 0);
  const totalHistoricalExpensesNum = Number(totalHistoricalExpenses[0]?.total || 0);
  const capitalTotal = totalHistoricalRevenueNum - totalHistoricalExpensesNum;

  // Expenses by category (current month)
  const expensesByCategory = await db
    .select({
      category: expenses.category,
      amount: sql<number>`sum(${expenses.amount})`,
    })
    .from(expenses)
    .where(
      and(
        gte(expenses.createdAt, startOfMonth),
        lte(expenses.createdAt, endOfMonth)
      )
    )
    .groupBy(expenses.category);

  // Combine monthly data with salaries
  const monthlyDataWithSalaries = monthlyData.map((m) => {
    const expenseRecord = monthlyExpenses.find(e => e.month === m.month);
    const expensesAmount = Number(expenseRecord?.amount || 0);
    return {
      month: m.month,
      revenue: Number(m.revenue),
      expenses: expensesAmount + totalMonthlySalaries,
      orders: Number(m.orderCount),
    };
  });

  // Fill missing months
  const completeMonthlyData: any[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = getMonthStart(i);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyDataWithSalaries.find(m => m.month === monthKey);
    completeMonthlyData.push({
      month: monthKey,
      monthName: d.toLocaleDateString('pt-BR', { month: 'short' }),
      revenue: existing?.revenue || 0,
      expenses: existing?.expenses || (i === 0 ? totalMonthlySalaries : 0),
      orders: existing?.orders || 0,
    });
  }

  // Add salaries to current month expenses by category
  const expensesByCategoryWithSalaries = [
    ...expensesByCategory.map(e => ({
      category: e.category,
      amount: Number(e.amount),
    })),
    ...(totalMonthlySalaries > 0 ? [{
      category: 'salarios',
      amount: totalMonthlySalaries,
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral do desempenho da loja.
        </p>
      </div>

      <DashboardClient
        monthRevenue={monthRevenue}
        monthExpenses={monthExpenses}
        operatingBalance={operatingBalance}
        capitalTotal={capitalTotal}
        activeEmployeesCount={activeEmployeesCountNum}
        totalProducts={totalProductsNum}
        monthlyData={completeMonthlyData}
        expensesByCategory={expensesByCategoryWithSalaries}
        currentMonth={selectedMonth}
      />
    </div>
  );
}
