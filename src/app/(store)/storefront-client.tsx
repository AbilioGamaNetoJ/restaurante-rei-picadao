'use client';

import * as React from 'react';


import { useState } from "react";
import { ClosedStoreDialog } from "@/components/store/closed-store-dialog";
import { ProductDetailModal, Product } from "@/components/store/product-detail-modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { StoreIcon, ShoppingCart } from "lucide-react";
import { CartDrawer } from "@/components/store/cart-drawer";
import { useCartStore } from "@/stores/cart-store";

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

interface StorefrontClientProps {
  categories: Category[];
  products: any[]; // Using any to simplify, mapping it to Product interface when used
  hours: any[];
}

export function StorefrontClient({ categories, products, hours }: StorefrontClientProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categories[0]?.id || null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to check if store is open right now
  const isStoreOpen = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    const todayHours = hours.filter(h => h.dayOfWeek === currentDay);
    if (todayHours.length === 0) return false;

    return todayHours.some(h => {
      if (!h.isOpen) return false;
      const [openH, openM] = h.openTime.split(':').map(Number);
      const [closeH, closeM] = h.closeTime.split(':').map(Number);
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;
      return currentTime >= openTime && currentTime <= closeTime;
    });
  };

  const filteredProducts = selectedCategory 
    ? products.filter(p => p.categories.some((c: any) => c.categoryId === selectedCategory))
    : products;

  return (
    <>
      {mounted && <ClosedStoreDialog isOpenStatus={isStoreOpen()} />}
      
      {/* Horizontal Category Carousel - Sticky below main header */}
      <div className="sticky top-[64px] z-40 w-full bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <ScrollArea className="w-full whitespace-nowrap py-3">
            <div className="flex w-max space-x-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum produto encontrado nesta categoria.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              onClick={() => setSelectedProduct({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                imageUrl: product.imageUrl,
                addons: product.addons,
                servesPeople: product.servesPeople,
                originalPrice: product.originalPrice
              })}
            >
              {product.imageUrl ? (
                <div className="aspect-video w-full overflow-hidden bg-gray-100">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-gray-100 flex items-center justify-center text-gray-400">
                  Sem imagem
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-2 mt-1 mb-2">
                  {product.description}
                </p>
                {product.servesPeople && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 bg-gray-50 self-start px-2 py-1 rounded-full border border-gray-100">
                    <span className="text-gray-400">👥</span>
                    <span>Serve {product.servesPeople} {product.servesPeople > 1 ? 'pessoas' : 'pessoa'}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-auto">
                  <div className="font-bold text-primary text-lg">
                    R$ {parseFloat(product.price).toFixed(2)}
                  </div>
                  {product.originalPrice && (
                    <div className="text-sm text-muted-foreground line-through">
                      R$ {parseFloat(product.originalPrice).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ProductDetailModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      {/* Floating Cart Button for Mobile */}
      {mounted && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <CartDrawer 
            trigger={
              <button className="flex items-center gap-3 bg-red-600 text-white px-5 py-3 rounded-full shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 group">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  <CartBadge />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] uppercase font-bold opacity-80">Carrinho</span>
                  <CartTotal />
                </div>
              </button>
            }
          />
        </div>
      )}
    </>
  );
}

function CartBadge() {
  const [mounted, setMounted] = React.useState(false);
  const items = useCartStore((state) => state.items);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  if (!mounted || totalItems === 0) return null;
  
  return (
    <span className="absolute -top-2 -right-2 bg-white text-red-600 text-[10px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-red-100 shadow-sm">
      {totalItems}
    </span>
  );
}

function CartTotal() {
  const [mounted, setMounted] = React.useState(false);
  const getTotal = useCartStore((state) => state.getTotal);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const total = getTotal();
  
  if (!mounted) return null;

  return (
    <span className="text-sm font-bold">
      R$ {total.toFixed(2)}
    </span>
  );
}
