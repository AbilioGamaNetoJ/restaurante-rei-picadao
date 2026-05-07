'use client';

import { useState } from "react";
import { CartDrawer } from "@/components/store/cart-drawer";
import { ClosedStoreDialog } from "@/components/store/closed-store-dialog";
import { ProductDetailModal, Product } from "@/components/store/product-detail-modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { StoreIcon } from "lucide-react";

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categories[0]?.id || null);

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
    ? products.filter(p => p.categoryId === selectedCategory)
    : products;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ClosedStoreDialog isOpenStatus={isStoreOpen()} />
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-md">
              <StoreIcon className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold">Rei do Picadão</h1>
          </div>
          <div className="flex items-center gap-4">
            <CartDrawer />
          </div>
        </div>
        
        {/* Horizontal Category Carousel */}
        <div className="border-t">
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
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
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
                  addons: product.addons
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
                  <p className="text-muted-foreground text-sm line-clamp-2 mt-1 mb-4 flex-1">
                    {product.description}
                  </p>
                  <div className="font-bold text-primary text-lg">
                    R$ {parseFloat(product.price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <ProductDetailModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />
    </div>
  );
}
