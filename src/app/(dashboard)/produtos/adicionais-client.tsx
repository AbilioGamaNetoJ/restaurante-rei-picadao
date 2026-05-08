'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createAddon, updateAddon, deleteAddon } from './adicionais-actions';
import { createCategory } from '@/app/(dashboard)/categorias/actions';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import { UploadButton } from '@/lib/uploadthing';

export function AdicionaisClient({ addons, categories }: { addons: any[], categories: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State for new category creation
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      description: '', 
      price: '', 
      categoryId: categories[0]?.id || '', 
      imageUrl: '', 
      isAvailable: true 
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (addon: any) => {
    setEditingId(addon.id);
    setFormData({
      name: addon.name,
      description: addon.description || '',
      price: addon.price,
      categoryId: addon.categoryId || '',
      imageUrl: addon.imageUrl || '',
      isAvailable: addon.isAvailable,
    });
    setIsOpen(true);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    startTransition(async () => {
      try {
        await createCategory({
          name: newCategoryName,
          type: 'adicional',
          sortOrder: categories.length
        });
        toast.success('Categoria criada');
        setNewCategoryName('');
        setIsAddingCategory(false);
      } catch (error) {
        toast.error('Erro ao criar categoria');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Selecione uma categoria');
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          await updateAddon(editingId, formData);
          toast.success('Adicional atualizado');
        } else {
          await createAddon(formData);
          toast.success('Adicional criado');
        }
        setIsOpen(false);
      } catch (error) {
        toast.error('Erro ao salvar adicional');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente excluir este adicional?')) return;
    startTransition(async () => {
      try {
        await deleteAddon(id);
        toast.success('Adicional excluído');
      } catch (error) {
        toast.error('Erro ao excluir adicional');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input placeholder="Buscar adicionais..." className="max-w-sm" />
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <button 
              onClick={handleOpenNew}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Adicional
            </button>
          } />
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Adicional' : 'Novo Adicional'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Ex: Molho grande 50ml" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="categoryId">Categoria</Label>
                    {!isAddingCategory && (
                      <button 
                        type="button" 
                        onClick={() => setIsAddingCategory(true)}
                        className="text-[10px] text-primary hover:underline font-medium"
                      >
                        + Novo Tipo
                      </button>
                    )}
                  </div>
                  
                  {isAddingCategory ? (
                    <div className="flex gap-1 items-center">
                      <Input 
                        size={1} 
                        className="h-8 text-xs" 
                        placeholder="Nome..." 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        autoFocus
                      />
                      <Button type="button" size="icon" className="h-8 w-8" onClick={handleAddCategory}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsAddingCategory(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <select 
                      id="categoryId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      required
                    >
                      <option value="" disabled>Selecione...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagem (Opcional)</Label>
                <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-md bg-slate-50 dark:bg-slate-900/50">
                  {formData.imageUrl ? (
                    <div className="relative h-20 w-20 rounded-md overflow-hidden border">
                      <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, imageUrl: ''})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Plus className="h-6 w-6" />
                    </div>
                  )}
                  <UploadButton
                    endpoint="productImage"
                    onClientUploadComplete={(res) => {
                      if (res?.[0]) {
                        setFormData({ ...formData, imageUrl: res[0].url });
                        toast.success("Imagem enviada!");
                      }
                    }}
                    onUploadError={(error: Error) => {
                      toast.error(`Erro: ${error.message}`);
                    }}
                    appearance={{
                      button: "bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 rounded-md text-xs",
                      allowedContent: "hidden",
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="addon-available" 
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                />
                <Label htmlFor="addon-available">Disponível para venda</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>Salvar Adicional</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {addons.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Nenhum adicional cadastrado.</div>
        ) : (
          addons.map(addon => (
            <Card key={addon.id} className={!addon.isAvailable ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex gap-4">
                <div className="h-16 w-16 bg-slate-100 rounded-md flex-shrink-0 relative overflow-hidden">
                  {addon.imageUrl ? (
                    <Image src={addon.imageUrl} alt={addon.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">Sem foto</div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-sm leading-none mb-1">{addon.name}</h3>
                      <div className="text-[10px] uppercase text-muted-foreground font-semibold">
                        {addon.category?.name || 'Sem categoria'}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{addon.description}</div>
                      <div className="text-sm font-bold mt-1 text-primary">R$ {Number(addon.price).toFixed(2)}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(addon)}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(addon.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
