'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Simplified interfaces for the frontend
export interface Addon {
  id: string;
  name: string;
  price: string;
  category: { id: string; name: string } | null;
  imageUrl: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  addons?: { addon: Addon }[];
  servesPeople?: number | null;
  originalPrice?: string | null;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: Readonly<ProductDetailModalProps>) {
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<{ [addonId: string]: number }>({});
  const addItem = useCartStore((state) => state.addItem);

  if (!product) return null;

  const isSauceCategory = (name: string) => ['Molho Extra', 'Molhos Extras', 'Molhos', 'Molho Grande'].includes(name);

  const handleAddonToggle = (addonId: string, checked: boolean, catName: string) => {
    if (isSauceCategory(catName) && checked) {
      setSelectedAddons(prev => {
        const next: Record<string, number> = {};
        for (const [id, qty] of Object.entries(prev)) {
          const a = product.addons?.find(pa => pa.addon.id === id);
          if (a && !isSauceCategory(a.addon.category?.name || '')) {
            next[id] = qty;
          }
        }
        next[addonId] = 1;
        return next;
      });
      return;
    }

    if (catName === 'Bebidas' && checked) {
      setSelectedAddons(prev => {
        const next: Record<string, number> = {};
        for (const [id, qty] of Object.entries(prev)) {
          const a = product.addons?.find(pa => pa.addon.id === id);
          if (a && a.addon.category?.name !== 'Bebidas') {
            next[id] = qty;
          }
        }
        next[addonId] = 1;
        return next;
      });
      return;
    }

    setSelectedAddons(prev => {
      const next = { ...prev };
      if (checked) {
        next[addonId] = 1;
      } else {
        delete next[addonId];
      }
      return next;
    });
  };

  const handleAddonQuantityChange = (addonId: string, delta: number) => {
    setSelectedAddons(prev => {
      const current = prev[addonId] || 0;
      const nextVal = current + delta;
      if (nextVal <= 0) {
        const next = { ...prev };
        delete next[addonId];
        return next;
      }

      const a = product.addons?.find(pa => pa.addon.id === addonId);
      if (a && isSauceCategory(a.addon.category?.name || '')) {
        return prev;
      }
      if (a?.addon.category?.name === 'Bebidas') {
        const otherBebidasTotal = Object.entries(prev).reduce((sum, [id, qty]) => {
          if (id === addonId) return sum;
          const item = product.addons?.find(pa => pa.addon.id === id);
          return sum + (item?.addon.category?.name === 'Bebidas' ? qty : 0);
        }, 0);
        if (otherBebidasTotal + nextVal > 2) return prev;
      }

      return { ...prev, [addonId]: nextVal };
    });
  };

  const handleAddToCart = () => {
    const addonsToCart = product.addons
      ?.filter(a => selectedAddons[a.addon.id])
      .map(a => {
        const price = Number.parseFloat(a.addon.price);
        return {
          id: a.addon.id,
          name: a.addon.name,
          price: price,
          quantity: selectedAddons[a.addon.id],
          imageUrl: a.addon.imageUrl,
        };
      }) || [];

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      price: Number.parseFloat(product.price),
      imageUrl: product.imageUrl,
      quantity,
      comment,
      addons: addonsToCart,
      subtotal: Number.parseFloat(product.price) * quantity + addonsToCart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0),
    });

    useCartStore.getState().setDrawerOpen(true);
    toast.custom(() => {
      if (typeof document === 'undefined') return <></>;
      return (
        <>
          {createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
              <div className="bg-green-50/80 backdrop-blur-md border-2 border-green-500 shadow-2xl rounded-2xl p-6 min-h-[160px] w-full max-w-[300px] flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200 pointer-events-auto">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-green-900 leading-tight mb-1">{product.name}</p>
                <p className="text-green-700 font-medium text-sm">foi adicionado ao carrinho!</p>
              </div>
            </div>,
            document.body
          )}
        </>
      );
    }, { duration: 2000 });
    onClose();
    // Reset state
    setQuantity(1);
    setComment('');
    setSelectedAddons({});
  };

  const bebidasTotalQty = product.addons?.reduce((acc, a) => {
    if (a.addon.category?.name === 'Bebidas') {
      return acc + (selectedAddons[a.addon.id] || 0);
    }
    return acc;
  }, 0) || 0;

  const productPrice = Number.parseFloat(product.price);
  const addonsTotal = product.addons?.reduce((acc, a) => {
    const q = selectedAddons[a.addon.id] || 0;
    const price = Number.parseFloat(a.addon.price);
    return acc + (price * q);
  }, 0) || 0;

  const total = productPrice * quantity + addonsTotal;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0">
        <div className="grid gap-4">
          {product.imageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={product.imageUrl} alt={product.name} className="w-full aspect-video object-cover rounded-t-xl" />
          )}

          <div className="px-5 space-y-1.5">
            <DialogTitle className="text-xl font-bold leading-snug">{product.name}</DialogTitle>
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            )}
          </div>
          
          {product.servesPeople && (
            <div className="px-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-2 rounded-md">
                <span>👥</span>
                <span>Este item serve {product.servesPeople} {product.servesPeople > 1 ? 'pessoas' : 'pessoa'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 px-5">
            <div className="font-bold text-2xl text-primary">R$ {productPrice.toFixed(2)}</div>
            {product.originalPrice && (
              <div className="text-base text-muted-foreground line-through">
                R$ {Number.parseFloat(product.originalPrice).toFixed(2)}
              </div>
            )}
          </div>

          {/* Addons Section */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-4 px-5">
              {(() => {
                const grouped = product.addons.reduce<Record<string, typeof product.addons>>((acc, item) => {
                  const catName = item.addon.category?.name || 'Adicionais';
                  if (!acc[catName]) acc[catName] = [];
                  acc[catName].push(item);
                  return acc;
                }, {});
                return Object.entries(grouped).map(([catName, addons]) => (
                  <div key={catName} className="space-y-2">
                    <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-bold text-sm text-gray-800">{catName}</span>
                      </div>
                      <span className="text-xs text-gray-400">Escolha uma opção</span>
                    </div>
                    {addons.map((item) => (
                      <div key={item.addon.id} className="flex items-center justify-between border-b pb-2 gap-2">
                        <div className="flex items-center gap-3">
                          {item.addon.imageUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                              src={item.addon.imageUrl} 
                              alt={item.addon.name} 
                              className="w-12 h-12 object-cover rounded-md flex-shrink-0" 
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium">{item.addon.name}</p>
                            <p className="text-xs text-gray-500">+ R$ {Number.parseFloat(item.addon.price).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        {isSauceCategory(catName) ? (
                          selectedAddons[item.addon.id] ? (
                            <Button variant="outline" size="sm" onClick={() => handleAddonToggle(item.addon.id, false, catName)} className="h-8">
                              Remover
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleAddonToggle(item.addon.id, true, catName)} className="h-8">
                              Adicionar
                            </Button>
                          )
                        ) : selectedAddons[item.addon.id] ? (
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAddonQuantityChange(item.addon.id, -1)}>-</Button>
                            <span className="text-sm font-medium min-w-[20px] text-center">{selectedAddons[item.addon.id]}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleAddonQuantityChange(item.addon.id, 1)}
                              disabled={catName === 'Bebidas' && bebidasTotalQty >= 2}
                            >+</Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => handleAddonToggle(item.addon.id, true, catName)}
                            disabled={catName === 'Bebidas' && bebidasTotalQty >= 2}
                          >
                            Adicionar
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}

          <div className="space-y-2 px-5">
            <Label htmlFor="comment">Observações</Label>
            <Input
              id="comment"
              placeholder="Ex: Tirar cebola, ponto da carne..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between px-5 pb-2">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</Button>
              <span className="font-medium">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>+</Button>
            </div>
            <div className="font-bold text-xl">
              R$ {total.toFixed(2)}
            </div>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0">
          <Button onClick={handleAddToCart} className="w-full">Adicionar ao Carrinho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
