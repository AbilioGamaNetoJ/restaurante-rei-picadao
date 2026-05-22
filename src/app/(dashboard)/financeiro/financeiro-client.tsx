'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createExpense, deleteExpense, updateExpense } from './actions';
import { Plus, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { EXPENSE_CATEGORIES, getCategoryLabel } from '@/lib/expense-categories';

// Helper functions for price formatting
const toDisplayPrice = (val: any) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.replace(/\./g, ',');
};

const toBackendPrice = (val: string) => {
  if (!val) return '';
  return val.replace(/,/g, '.');
};

const sanitizeAndFormatPrice = (value: string) => {
  let clean = value.replace(/R\$\s*/gi, '');
  const lastCommaIndex = clean.lastIndexOf(',');
  const lastDotIndex = clean.lastIndexOf('.');

  if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
    if (lastCommaIndex > lastDotIndex) {
      clean = clean.replace(/\./g, '');
    } else {
      clean = clean.replace(/,/g, '').replace(/\./g, ',');
    }
  } else if (lastCommaIndex === -1 && lastDotIndex !== -1) {
    clean = clean.replace(/\./g, ',');
  }

  clean = clean.replace(/[^0-9,]/g, '');

  const parts = clean.split(',');
  if (parts.length > 2) {
    clean = parts[0] + ',' + parts.slice(1).join('');
  }

  return clean;
};

export function FinanceiroClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    customCategory: ''
  });

  // Filter expenses by selected month
  const filteredExpenses = initialExpenses.filter(expense => {
    const expenseDate = new Date(expense.createdAt);
    return expenseDate.getMonth() === currentMonth.getMonth() &&
           expenseDate.getFullYear() === currentMonth.getFullYear();
  });

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ description: '', amount: '', category: '', customCategory: '' });
    setIsOpen(true);
  };

  const handleOpenEdit = (expense: any) => {
    setEditingId(expense.id);
    setFormData({
      description: expense.description,
      amount: toDisplayPrice(expense.amount),
      category: expense.category,
      customCategory: ''
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = formData.category === 'outros'
      ? (formData.customCategory || 'Outros')
      : formData.category;

    if (!finalCategory) {
      toast.error('Selecione uma categoria', { style: { color: '#dc2626' } });
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          description: formData.description,
          amount: toBackendPrice(formData.amount),
          category: finalCategory
        };

        if (editingId) {
          await updateExpense(editingId, payload);
          toast.success('Despesa atualizada com sucesso!', { style: { color: '#16a34a' } });
        } else {
          await createExpense(payload);
          toast.success('Despesa registrada com sucesso!', { style: { color: '#16a34a' } });
        }
        handleCloseDialog();
      } catch (error) {
        toast.error('Erro ao salvar despesa', { style: { color: '#dc2626' } });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;
    startTransition(async () => {
      try {
        await deleteExpense(id);
        toast.success('Despesa excluída com sucesso!', { style: { color: '#16a34a' } });
      } catch (error) {
        toast.error('Erro ao excluir despesa', { style: { color: '#dc2626' } });
      }
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const categoryColors: Record<string, string> = {
    assinaturas: 'bg-blue-100 text-blue-800',
    alimentos: 'bg-green-100 text-green-800',
    energia: 'bg-yellow-100 text-yellow-800',
    agua: 'bg-cyan-100 text-cyan-800',
    aluguel: 'bg-purple-100 text-purple-800',
    motoboys: 'bg-orange-100 text-orange-800',
    salarios: 'bg-red-100 text-red-800',
    manutencao: 'bg-gray-100 text-gray-800',
    marketing: 'bg-pink-100 text-pink-800',
    embalagens: 'bg-indigo-100 text-indigo-800',
    outros: 'bg-slate-100 text-slate-800',
  };

  const getCategoryColor = (category: string) => {
    const categoryValue = EXPENSE_CATEGORIES.find(c => c.value === category)?.value || 'outros';
    return categoryColors[categoryValue] || categoryColors.outros;
  };

  return (
    <div className="space-y-6">
      {/* Total Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatMonthYear(currentMonth)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredExpenses.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredExpenses.length > 0
                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses / filteredExpenses.length)
                : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header com mês e botão nova despesa */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Despesas</h2>
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2 capitalize min-w-[140px] text-center">
              {formatMonthYear(currentMonth)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger nativeButton={true} render={
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" /> Nova Despesa
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  placeholder="Ex: Compra de embalagens"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$)</Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: sanitizeAndFormatPrice(e.target.value)})}
                  required
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value, customCategory: ''})}
                  required
                >
                  <option value="">Selecione...</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {formData.category === 'outros' && (
                <div className="space-y-2">
                  <Label htmlFor="customCategory">Outra Categoria</Label>
                  <Input
                    id="customCategory"
                    value={formData.customCategory}
                    onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                    placeholder="Ex: Impostos"
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de despesas */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhuma despesa encontrada para {formatMonthYear(currentMonth)}.
              </div>
            ) : (
              filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{expense.description}</h3>
                      <Badge className={getCategoryColor(expense.category)}>
                        {getCategoryLabel(expense.category)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registrado por: {expense.createdBy} em {new Date(expense.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-red-500 text-lg">
                      -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(expense.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(expense)}
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => handleDelete(expense.id)}
                      disabled={isPending}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
