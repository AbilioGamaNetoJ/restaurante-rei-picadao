'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { createCategory, updateCategory, deleteCategory } from './actions';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export function CategoriasClient({ initialCategories }: { initialCategories: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'produto' as 'produto' | 'adicional',
    sortOrder: 0,
    isActive: true
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: '', type: 'produto', sortOrder: 0, isActive: true });
    setIsOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingId(cat.id);
    setFormData({
      name: cat.name,
      type: cat.type,
      sortOrder: cat.sortOrder,
      isActive: cat.isActive
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingId) {
          await updateCategory(editingId, formData);
          toast.success('Categoria atualizada');
        } else {
          await createCategory(formData);
          toast.success('Categoria criada');
        }
        setIsOpen(false);
      } catch (error) {
        toast.error('Erro ao salvar categoria');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;
    startTransition(async () => {
      try {
        await deleteCategory(id);
        toast.success('Categoria excluída');
      } catch (error) {
        toast.error('Erro ao excluir categoria');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input placeholder="Buscar categorias..." className="max-w-sm" />
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <button 
              onClick={handleOpenNew}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Categoria
            </button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <select 
                  id="type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                  <option value="produto">Produto</option>
                  <option value="adicional">Adicional</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordem (menor aparece primeiro)</Label>
                <Input 
                  id="sortOrder" 
                  type="number" 
                  value={formData.sortOrder} 
                  onChange={(e) => setFormData({...formData, sortOrder: Number(e.target.value)})} 
                  required 
                />
              </div>
              {editingId && (
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <Label htmlFor="isActive">Categoria Ativa</Label>
                </div>
              )}
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
            {initialCategories.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">Nenhuma categoria encontrada.</div>
            ) : (
              initialCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-medium">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Tipo: {cat.type} | Ordem: {cat.sortOrder} | Status: {cat.isActive ? 'Ativa' : 'Inativa'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleOpenEdit(cat)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(cat.id)}>
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
