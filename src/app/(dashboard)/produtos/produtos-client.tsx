'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createProduct, updateProduct, deleteProduct } from './actions';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import Image from 'next/image';
import { UploadButton } from '@/lib/uploadthing';

export function ProdutosClient({ initialProducts, categories, addons }: { initialProducts: any[], categories: any[], addons: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryIds: [] as string[],
    description: '',
    price: '',
    costPrice: '',
    imageUrl: '',
    isAvailable: true,
    sortOrder: 0,
    addonsIds: [] as string[],
    servesPeople: '' as string | number,
    originalPrice: '',
    isFeatured: false
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ 
      name: '', categoryIds: [], description: '', 
      price: '', costPrice: '', imageUrl: '', isAvailable: true, sortOrder: 0, addonsIds: [],
      servesPeople: '', originalPrice: '', isFeatured: false
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      categoryIds: product.categories.map((c: any) => c.categoryId),
      description: product.description || '',
      price: product.price,
      costPrice: product.costPrice || '',
      imageUrl: product.imageUrl || '',
      isAvailable: product.isAvailable,
      sortOrder: product.sortOrder,
      addonsIds: product.addons.map((a: any) => a.addonId),
      servesPeople: product.servesPeople || '',
      originalPrice: product.originalPrice || '',
      isFeatured: product.isFeatured || false
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.categoryIds.length === 0) {
      toast.error('Selecione pelo menos uma categoria');
      return;
    }

    startTransition(async () => {
      try {
        if (editingId) {
          await updateProduct(editingId, {
            ...formData,
            servesPeople: formData.servesPeople === '' ? undefined : Number(formData.servesPeople),
            originalPrice: formData.originalPrice || undefined
          });
          toast.success('Produto atualizado');
        } else {
          await createProduct({
            ...formData,
            servesPeople: formData.servesPeople === '' ? undefined : Number(formData.servesPeople),
            originalPrice: formData.originalPrice || undefined
          });
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
          <DialogTrigger render={
            <button 
              onClick={handleOpenNew}
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Produto
            </button>
          } />
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
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="categoryIds">Categorias</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.categoryIds.map(catId => {
                      const cat = categories.find(c => c.id === catId);
                      return (
                        <Badge key={catId} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                          {cat?.name}
                          <button 
                            type="button" 
                            onClick={() => setFormData({
                              ...formData, 
                              categoryIds: formData.categoryIds.filter(id => id !== catId)
                            })}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                  <select 
                    id="categoryIds"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val && !formData.categoryIds.includes(val)) {
                        setFormData({
                          ...formData,
                          categoryIds: [...formData.categoryIds, val]
                        });
                      }
                    }}
                  >
                    <option value="" disabled>Adicionar categoria...</option>
                    {categories
                      .filter(c => !formData.categoryIds.includes(c.id))
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="servesPeople">Serve quantas pessoas? (Opcional)</Label>
                  <Input id="servesPeople" type="number" placeholder="Ex: 2" value={formData.servesPeople} onChange={(e) => setFormData({...formData, servesPeople: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Preço Original / Riscar (Opcional)</Label>
                  <Input id="originalPrice" type="number" step="0.01" placeholder="Ex: 89.90" value={formData.originalPrice} onChange={(e) => setFormData({...formData, originalPrice: e.target.value})} />
                  <p className="text-[10px] text-muted-foreground">Isso mostrará "De R$ 89,90 por R$ [Preço de Venda]"</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagem do Produto</Label>
                <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-md bg-slate-50 dark:bg-slate-900/50">
                  {formData.imageUrl ? (
                    <div className="relative h-24 w-24 rounded-md overflow-hidden border shadow-sm">
                      <Image src={formData.imageUrl} alt="Preview" fill className="object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, imageUrl: ''})}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <Plus className="h-8 w-8" />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <UploadButton
                      endpoint="productImage"
                      onClientUploadComplete={(res) => {
                        if (res?.[0]) {
                          setFormData({ ...formData, imageUrl: res[0].url });
                          toast.success("Imagem enviada com sucesso!");
                        }
                      }}
                      onUploadError={(error: Error) => {
                        toast.error(`Erro no upload: ${error.message}`);
                      }}
                      appearance={{
                        button: "bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors ut-uploading:cursor-not-allowed",
                        allowedContent: "text-xs text-muted-foreground",
                      }}
                    />
                    <p className="text-xs text-muted-foreground">Formatos aceitos: JPG, PNG, WEBP (Max 4MB)</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-xs">Ou cole uma URL externa</Label>
                  <Input 
                    id="imageUrl" 
                    value={formData.imageUrl} 
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                    placeholder="https://..." 
                  />
                </div>
              </div>

              <div className="space-y-4 border rounded-md p-4 bg-slate-50 dark:bg-slate-900/50">
                <Label className="text-base font-semibold">Adicionais Permitidos</Label>
                
                <div className="space-y-4">
                  {/* Agrupamento dinâmico por categoria */}
                  {Array.from(new Set(addons.map(a => a.categoryId))).map((catId) => {
                    const filteredAddons = addons.filter(a => a.categoryId === catId);
                    if (filteredAddons.length === 0) return null;
                    const categoryName = filteredAddons[0].category?.name || 'Geral';
                    
                    return (
                      <div key={catId || 'geral'} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                          {categoryName}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            <div key={addon.id} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                              <input 
                                type="checkbox" 
                                id={`addon-${addon.id}`}
                                checked={formData.addonsIds.includes(addon.id)}
                                onChange={() => toggleAddon(addon.id)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor={`addon-${addon.id}`} className="flex items-center gap-3 font-normal cursor-pointer text-sm w-full">
                                {addon.imageUrl && (
                                  <img 
                                    src={addon.imageUrl} 
                                    alt={addon.name} 
                                    className="w-10 h-10 object-cover rounded-md flex-shrink-0" 
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold truncate">{addon.name}</div>
                                  <div className="text-primary font-medium text-xs">(+R$ {Number(addon.price).toFixed(2)})</div>
                                  {addon.description && (
                                    <span className="block text-[10px] text-muted-foreground leading-tight truncate">
                                      {addon.description}
                                    </span>
                                  )}
                                </div>
                              </Label>
                            </div>
                        </div>
                      </div>
                    );
                  })}
                  {addons.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">Nenhum adicional cadastrado. Vá na aba "Adicionais" para criar.</p>
                  )}
                </div>
              </div>

                <div className="flex items-center gap-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isAvailable" 
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="isAvailable" className="cursor-pointer">Disponível</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="isFeatured" 
                      checked={formData.isFeatured}
                      onChange={(e) => setFormData({...formData, isFeatured: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <Label htmlFor="isFeatured" className="cursor-pointer font-bold text-amber-600">Destaque (Página Principal)</Label>
                  </div>
                </div>
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium leading-none">{product.name}</h3>
                      {product.isFeatured && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px] h-4 px-1">
                          ★ Destaque
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-primary">R$ {Number(product.price).toFixed(2)}</div>
                      {product.originalPrice && (
                        <div className="text-xs text-muted-foreground line-through">R$ {Number(product.originalPrice).toFixed(2)}</div>
                      )}
                    </div>
                    {product.servesPeople && (
                      <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                        👥 Serve {product.servesPeople} {product.servesPeople > 1 ? 'pessoas' : 'pessoa'}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.categories.map((pc: any) => (
                      <span key={pc.categoryId} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {pc.category.name}
                      </span>
                    ))}
                  </div>
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
