'use client';

import * as React from 'react';


import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
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

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<{ [addonId: string]: number }>({});
  const addItem = useCartStore((state) => state.addItem);

  if (!product) return null;

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    setSelectedAddons(prev => {
      const next = { ...prev };
      if (checked) {
        next[addonId] = 1; // default quantity 1 for selected addon
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
      return { ...prev, [addonId]: nextVal };
    });
  };

  const handleAddToCart = () => {
    const addonsToCart = product.addons
      ?.filter(a => selectedAddons[a.addon.id])
      .map(a => ({
        id: a.addon.id,
        name: a.addon.name,
        price: parseFloat(a.addon.price),
        quantity: selectedAddons[a.addon.id],
        imageUrl: a.addon.imageUrl,
      })) || [];

    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price),
      imageUrl: product.imageUrl,
      quantity,
      comment,
      addons: addonsToCart,
      subtotal: parseFloat(product.price) * quantity + addonsToCart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0),
    });

    useCartStore.getState().setDrawerOpen(true);
    toast.success(`${product.name} adicionado ao carrinho!`);
    onClose();
    // Reset state
    setQuantity(1);
    setComment('');
    setSelectedAddons({});
  };

  const productPrice = parseFloat(product.price);
  const addonsTotal = product.addons?.reduce((acc, a) => {
    const q = selectedAddons[a.addon.id] || 0;
    return acc + (parseFloat(a.addon.price) * q);
  }, 0) || 0;
  
  const total = (productPrice + addonsTotal) * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} className="w-full h-48 object-cover rounded-md" />
          )}
          
          <p className="text-sm text-gray-500">{product.description}</p>
          
          {product.servesPeople && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gray-50 p-2 rounded-md">
              <span>👥</span>
              <span>Este item serve {product.servesPeople} {product.servesPeople > 1 ? 'pessoas' : 'pessoa'}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="font-bold text-2xl text-primary">R$ {productPrice.toFixed(2)}</div>
            {product.originalPrice && (
              <div className="text-base text-muted-foreground line-through">
                R$ {parseFloat(product.originalPrice).toFixed(2)}
              </div>
            )}
          </div>

          {/* Addons Section */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-4 mt-4">
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
                      <span className="text-xs text-gray-400">Escolha até {addons.length} opção{addons.length > 1 ? 'ões' : ''}</span>
                    </div>
                    {addons.map((item) => (
                      <div key={item.addon.id} className="flex items-center justify-between border-b pb-2 gap-2">
                        <div className="flex items-center gap-3">
                          {item.addon.imageUrl && (
                            <img 
                              src={item.addon.imageUrl} 
                              alt={item.addon.name} 
                              className="w-12 h-12 object-cover rounded-md flex-shrink-0" 
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium">{item.addon.name}</p>
                            <p className="text-xs text-gray-500">+ R$ {parseFloat(item.addon.price).toFixed(2)}</p>
                          </div>
                        </div>
                        
                        {selectedAddons[item.addon.id] ? (
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAddonQuantityChange(item.addon.id, -1)}>-</Button>
                            <span className="text-sm font-medium min-w-[20px] text-center">{selectedAddons[item.addon.id]}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleAddonQuantityChange(item.addon.id, 1)}>+</Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleAddonToggle(item.addon.id, true)} className="h-8">
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

          <div className="space-y-2 mt-4">
            <Label htmlFor="comment">Observações</Label>
            <Input
              id="comment"
              placeholder="Ex: Tirar cebola, ponto da carne..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between mt-6">
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

        <DialogFooter>
          <Button onClick={handleAddToCart} className="w-full">Adicionar ao Carrinho</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
