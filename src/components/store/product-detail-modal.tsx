'use client';

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
  category: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  addons?: { addon: Addon }[];
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
          <div className="font-bold text-lg">R$ {productPrice.toFixed(2)}</div>

          {/* Addons Section */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-3 mt-4">
              <h4 className="font-medium text-sm">Adicionais</h4>
              {product.addons.map((item) => (
                <div key={item.addon.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="text-sm">{item.addon.name}</p>
                    <p className="text-xs text-gray-500">+ R$ {parseFloat(item.addon.price).toFixed(2)}</p>
                  </div>
                  
                  {selectedAddons[item.addon.id] ? (
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleAddonQuantityChange(item.addon.id, -1)}>-</Button>
                      <span className="text-sm">{selectedAddons[item.addon.id]}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleAddonQuantityChange(item.addon.id, 1)}>+</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => handleAddonToggle(item.addon.id, true)}>
                      Adicionar
                    </Button>
                  )}
                </div>
              ))}
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
