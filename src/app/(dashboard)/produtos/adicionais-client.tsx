'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createAddon, updateAddon, deleteAddon } from './adicionais-actions';
import { createCategory, deleteCategory } from '@/app/(dashboard)/categorias/actions';
import { Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import { UploadButton } from '@/lib/uploadthing';

type Category = {
  id: string;
  name: string;
  slug: string;
  type: 'produto' | 'adicional';
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Addon = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  categoryId: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  category: Category | null;
};

// Helper functions for price formatting
const toDisplayPrice = (val: string | null | undefined) => {
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

export function AdicionaisClient({ addons, categories }: Readonly<{ addons: Addon[], categories: Category[] }>) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredAddons = addons.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

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

  const handleOpenEdit = (addon: Addon) => {
    setEditingId(addon.id);
    setFormData({
      name: addon.name,
      description: addon.description || '',
      price: toDisplayPrice(addon.price),
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
      } catch {
        toast.error('Erro ao criar categoria');
      }
    });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Excluir esta categoria? Os adicionais nela ficarão sem categoria.')) return;
    
    startTransition(async () => {
      try {
        await deleteCategory(id);
        toast.success('Categoria excluída');
        if (formData.categoryId === id) {
          setFormData({ ...formData, categoryId: '' });
        }
      } catch {
        toast.error('Erro ao excluir categoria');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Selecione uma categoria');
      return;
    }

    const payload = {
      ...formData,
      price: toBackendPrice(formData.price),
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateAddon(editingId, payload);
          toast.success('Adicional atualizado');
        } else {
          await createAddon(payload);
          toast.success('Adicional criado');
        }
        setIsOpen(false);
      } catch {
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
      } catch {
        toast.error('Erro ao excluir adicional');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Input
            placeholder="Buscar adicionais..."
            className="pr-10 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger nativeButton={true} render={
            <button 
              onClick={handleOpenNew}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
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
                  <Input 
                    id="price" 
                    type="text" 
                    inputMode="decimal" 
                    value={formData.price} 
                    onChange={(e) => setFormData({...formData, price: sanitizeAndFormatPrice(e.target.value)})} 
                    required 
                  />
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
                    <div className="space-y-1 max-h-[120px] overflow-y-auto border rounded-md p-1 bg-slate-50/50">
                      {categories.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground p-2 text-center italic">Nenhuma categoria</div>
                      ) : (
                        categories.map(cat => (
                          <div
                            key={cat.id}
                            role="button"
                            tabIndex={0}
                            className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                              formData.categoryId === cat.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-slate-200 text-slate-700'
                            }`}
                            onClick={() => setFormData({...formData, categoryId: cat.id})}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setFormData({...formData, categoryId: cat.id});
                              }
                            }}
                          >
                            <span className="text-xs font-medium">{cat.name}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(cat.id);
                              }}
                              className={`p-0.5 rounded-full hover:bg-black/10 transition-colors ${
                                formData.categoryId === cat.id ? 'text-primary-foreground' : 'text-slate-400'
                              }`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
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
        {filteredAddons.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Nenhum adicional cadastrado.'}
          </div>
        ) : (
          filteredAddons.map(addon => (
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
                      <div className="text-sm font-bold mt-1 text-primary">R$ {Number(addon.price).toFixed(2).replace('.', ',')}</div>
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
