'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createExpense, deleteExpense } from './actions';
import { Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function FinanceiroClient({ initialExpenses }: { initialExpenses: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Geral'
  });

  const handleOpenNew = () => {
    setFormData({ description: '', amount: '', category: 'Geral' });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createExpense({
          ...formData,
          amount: parseFloat(formData.amount).toString()
        });
        toast.success('Despesa registrada');
        setIsOpen(false);
      } catch (error) {
        toast.error('Erro ao registrar despesa');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente excluir esta despesa?')) return;
    startTransition(async () => {
      try {
        await deleteExpense(id);
        toast.success('Despesa excluída');
      } catch (error) {
        toast.error('Erro ao excluir despesa');
      }
    });
  };

  const totalExpenses = initialExpenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Referente às despesas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Registro de Despesas</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" /> Nova Despesa
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Despesa</DialogTitle>
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
                  type="number" 
                  step="0.01"
                  value={formData.amount} 
                  onChange={(e) => setFormData({...formData, amount: e.target.value})} 
                  required 
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input 
                  id="category" 
                  value={formData.category} 
                  onChange={(e) => setFormData({...formData, category: e.target.value})} 
                  required 
                  placeholder="Ex: Insumos, Água, Luz"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {initialExpenses.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">Nenhuma despesa encontrada.</div>
            ) : (
              initialExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{expense.description}</h3>
                    <p className="text-sm text-muted-foreground">
                      Categoria: {expense.category} | Registrado por: {expense.createdBy} em {new Date(expense.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-red-500">
                      -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(expense.amount))}
                    </span>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(expense.id)} disabled={isPending}>
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
