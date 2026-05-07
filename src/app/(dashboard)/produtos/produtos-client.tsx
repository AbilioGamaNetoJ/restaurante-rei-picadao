'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createProduct, updateProduct, deleteProduct } from './actions';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';

export function ProdutosClient({ initialProducts, categories, addons }: { initialProducts: any[], categories: any[], addons: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: categories[0]?.id || '',
    description: '',
    price: '',
    costPrice: '',
    imageUrl: '',
    isAvailable: true,
    sortOrder: 0,
    addonsIds: [] as string[]
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ 
      name: '', categoryId: categories[0]?.id || '', description: '', 
      price: '', costPrice: '', imageUrl: '', isAvailable: true, sortOrder: 0, addonsIds: [] 
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      categoryId: product.categoryId,
      description: product.description || '',
      price: product.price,
      costPrice: product.costPrice || '',
      imageUrl: product.imageUrl || '',
      isAvailable: product.isAvailable,
      sortOrder: product.sortOrder,
      addonsIds: product.addons.map((a: any) => a.addonId)
    });
    setIsOpen(true);
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
          await updateProduct(editingId, formData);
          toast.success('Produto atualizado');
        } else {
          await createProduct(formData);
          toast.success('Produto criado');
        }
        setIsOpen(false);
      } catch (error) {
        toast.error('Erro ao salvar produto');
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    startTransition(async () => {
      try {
        await deleteProduct(id);
        toast.success('Produto excluído');
      } catch (error) {
        toast.error('Erro ao excluir produto');
      }
    });
  };

  const toggleAddon = (addonId: string) => {
    setFormData(prev => ({
      ...prev,
      addonsIds: prev.addonsIds.includes(addonId)
        ? prev.addonsIds.filter(id => id !== addonId)
        : [...prev.addonsIds, addonId]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Input placeholder="Buscar produtos..." className="max-w-sm" />
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenNew}>
              <Plus className="mr-2 h-4 w-4" /> Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <select 
                    id="categoryId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço de Venda (R$)</Label>
                  <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
                  <Input id="costPrice" type="number" step="0.01" value={formData.costPrice} onChange={(e) => setFormData({...formData, costPrice: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Ordem</Label>
                  <Input id="sortOrder" type="number" value={formData.sortOrder} onChange={(e) => setFormData({...formData, sortOrder: Number(e.target.value)})} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input id="imageUrl" value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://..." />
                <p className="text-xs text-muted-foreground">Cole a URL da imagem. UploadThing será integrado posteriormente.</p>
              </div>

              <div className="space-y-2 border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50">
                <Label>Adicionais Permitidos</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {addons.map(addon => (
                    <div key={addon.id} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`addon-${addon.id}`}
                        checked={formData.addonsIds.includes(addon.id)}
                        onChange={() => toggleAddon(addon.id)}
                      />
                      <Label htmlFor={`addon-${addon.id}`} className="font-normal cursor-pointer">
                        {addon.name} (+R$ {Number(addon.price).toFixed(2)})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {editingId && (
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isAvailable" 
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                  />
                  <Label htmlFor="isAvailable">Produto Disponível</Label>
                </div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={isPending}>Salvar Produto</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Nenhum produto cadastrado.</div>
        ) : (
          initialProducts.map(product => (
            <Card key={product.id} className={!product.isAvailable ? 'opacity-60' : ''}>
              <CardContent className="p-4 flex gap-4">
                <div className="h-20 w-20 bg-slate-100 rounded-md flex-shrink-0 relative overflow-hidden">
                  {product.imageUrl ? (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sem foto</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium leading-none mb-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                    <div className="text-sm font-bold">R$ {Number(product.price).toFixed(2)}</div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">{product.category.name}</span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(product)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
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
