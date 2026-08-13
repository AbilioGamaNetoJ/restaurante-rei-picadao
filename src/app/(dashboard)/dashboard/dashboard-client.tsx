'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCategoryLabel } from '@/lib/expense-categories';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f97316', // orange
];

type MonthlyDataEntry = {
  month: string;
  monthName: string;
  revenue: number;
  expenses: number;
  orders: number;
};

type ExpensesByCategoryEntry = {
  category: string;
  amount: number;
};

export function DashboardClient({
  monthRevenue,
  monthExpenses,
  operatingBalance,
  capitalTotal,
  activeEmployeesCount,
  totalProducts,
  monthlyData,
  expensesByCategory,
  currentMonth,
}: Readonly<{
  monthRevenue: number;
  monthExpenses: number;
  operatingBalance: number;
  capitalTotal: number;
  activeEmployeesCount: number;
  totalProducts: number;
  monthlyData: MonthlyDataEntry[];
  expensesByCategory: ExpensesByCategoryEntry[];
  currentMonth: Date;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    const monthParam = `${newMonth.getFullYear()}-${String(newMonth.getMonth() + 1).padStart(2, '0')}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', monthParam);
    router.push(`?${params.toString()}`);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const chartData = monthlyData.map((d) => ({
    name: d.monthName,
    receita: d.revenue,
    despesa: d.expenses,
  }));

  const pieData = expensesByCategory
    .filter((e) => e.amount > 0)
    .map((e) => ({
      name: getCategoryLabel(e.category),
      value: e.amount,
    }));

  return (
    <div className="space-y-8 pb-8">
      {/* Month Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold tracking-tight text-slate-900">Visão Geral</h3>
          <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-slate-100"
              onClick={() => navigateMonth('prev')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold px-4 min-w-[180px] text-center capitalize text-slate-700">
              {formatMonthYear(currentMonth)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-slate-100"
              onClick={() => navigateMonth('next')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shadow-sm hover:bg-slate-50 transition-colors"
          onClick={() => {
            window.location.replace('/dashboard');
          }}
        >
          Voltar ao Mês Atual
        </Button>
      </div>

      {/* KPI Cards - Bento Grid Layout */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Operacional - Destaque (Ocupa 2 colunas) */}
        <Card className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative">
          {/* Subtle background pattern/glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-slate-300 uppercase tracking-wider">Saldo Operacional</CardTitle>
            <div className={`p-2 rounded-full backdrop-blur-md ${operatingBalance >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {operatingBalance >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl sm:text-5xl font-bold tracking-tight mt-2">
              {formatCurrency(operatingBalance)}
            </div>
            <p className="text-sm text-slate-400 mt-3 font-medium">
              Receita subtraída das despesas do mês selecionado
            </p>
          </CardContent>
        </Card>

        {/* Receita do Mês */}
        <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Receita do Mês</CardTitle>
            <div className="p-2 bg-green-100/80 text-green-600 rounded-full">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              {formatCurrency(monthRevenue)}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium capitalize">
              {formatMonthYear(currentMonth)}
            </p>
          </CardContent>
        </Card>

        {/* Despesa do Mês */}
        <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Despesa do Mês</CardTitle>
            <div className="p-2 bg-red-100/80 text-red-600 rounded-full">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              {formatCurrency(monthExpenses)}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Inclui folha de pagamento
            </p>
          </CardContent>
        </Card>

        {/* Capital Total (Ocupa 2 colunas na linha de baixo) */}
        <Card className="md:col-span-2 transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-slate-200/60 shadow-sm bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Capital Total (Histórico)</CardTitle>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
              <Landmark className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-900 mt-2">
              {formatCurrency(capitalTotal)}
            </div>
            <p className="text-xs text-blue-600/70 mt-2 font-medium">
              Acumulado desde o início da operação
            </p>
          </CardContent>
        </Card>

        {/* Funcionários Ativos */}
        <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Equipe</CardTitle>
            <div className="p-2 bg-indigo-100/80 text-indigo-600 rounded-full">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              {activeEmployeesCount}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Funcionários ativos
            </p>
          </CardContent>
        </Card>

        {/* Total de Produtos */}
        <Card className="transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500">Cardápio</CardTitle>
            <div className="p-2 bg-amber-100/80 text-amber-600 rounded-full">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              {totalProducts}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Fluxo de Caixa */}
        <Card className="border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Fluxo de Caixa (Últimos 12 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }} 
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value: ValueType | undefined) => formatCurrency(Number(value || 0))}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px' }} />
                <Bar dataKey="receita" fill="#22c55e" name="Receita" radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="despesa" fill="#ef4444" name="Despesa" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gastos por Categoria */}
        <Card className="border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-800">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity duration-200 outline-none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: ValueType | undefined) => formatCurrency(Number(value || 0))}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: 'none', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' 
                    }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[320px] flex items-center justify-center text-slate-400 font-medium bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                Nenhuma despesa registrada neste mês
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
