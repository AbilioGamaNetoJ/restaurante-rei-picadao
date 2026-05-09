"use client";

import * as React from 'react';
import { useState, useRef, useEffect } from "react";
import { ClosedStoreDialog } from "@/components/store/closed-store-dialog";
import { ProductDetailModal, Product } from "@/components/store/product-detail-modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/store/cart-drawer";
import { useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";
import { 
  ShoppingCart, 
  Clock, 
  Star, 
  Bike, 
  StoreIcon 
} from "@/components/store/store-icons";

interface Category {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isVirtual?: boolean;
}

interface StorefrontClientProps {
  categories: Category[];
  products: any[];
  hours: any[];
  settings: any;
}

export function StorefrontClient({ categories, products, hours, settings }: StorefrontClientProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const featuredProducts = products.filter(p => p.isFeatured);
  const displayCategories = featuredProducts.length > 0 
    ? [{ id: 'featured', name: 'Destaques', slug: 'destaques', sortOrder: -1, isVirtual: true } as Category, ...categories]
    : categories;

  const [activeCategory, setActiveCategory] = useState<string>(displayCategories[0]?.id || "");
  
  const categoryRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Intersection Observer to update active category on scroll
  useEffect(() => {
    if (!mounted) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-100px 0px -50% 0px" }
    );

    Object.values(categoryRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [mounted, displayCategories]);

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      const headerOffset = 130;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const isStoreOpen = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const todayHours = hours.filter(h => h.dayOfWeek === currentDay);
    if (todayHours.length === 0) return false;

    return todayHours.some(h => {
      const [openH, openM] = h.openTime.split(':').map(Number);
      const [closeH, closeM] = h.closeTime.split(':').map(Number);
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;
      return currentTime >= openTime && currentTime <= closeTime;
    });
  };

  const openStatus = isStoreOpen();

  return (
    <div className="flex flex-col gap-8 pb-24">
      {mounted && <ClosedStoreDialog isOpenStatus={openStatus} />}
      
      {/* Hero Banner Section */}
      <div className="relative w-full h-[220px] md:h-[350px] -mt-8 -mx-4 container-none overflow-hidden group">
        {settings?.bannerUrl ? (
          <img 
            src={settings.bannerUrl} 
            alt="Banner" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-red-600 via-red-500 to-orange-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Store Info Card (Floating Premium) */}
      <div className="relative -mt-24 md:-mt-32 z-10 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/50 p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 max-w-5xl mx-auto w-full mx-auto ring-1 ring-black/5 transition-all duration-500 hover:shadow-[0_30px_70px_rgba(0,0,0,0.15)]">
        {/* Logo */}
        <div className="w-28 h-28 md:w-40 md:h-40 rounded-full border-8 border-white bg-white shadow-2xl overflow-hidden flex-shrink-0 -mt-20 md:-mt-24 transition-transform duration-500 hover:scale-105">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={settings.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white">
              <span className="text-5xl font-black tracking-tighter">{settings?.name?.[0] || "R"}</span>
            </div>
          )}
        </div>

        {/* Store Details */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter">
              {settings?.name || "Rei do Picadão"}
            </h1>
            <div className={cn(
              "self-center md:self-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors",
              openStatus 
                ? "bg-green-50 text-green-600 border-green-200" 
                : "bg-red-50 text-red-600 border-red-200"
            )}>
              {openStatus ? "• Aberto agora" : "• Fechado"}
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-8 gap-y-3 text-sm text-gray-500 font-medium">
            <div className="flex items-center gap-2">
              <div className="bg-yellow-50 p-1.5 rounded-lg">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              </div>
              <span className="font-bold text-gray-900">4.8</span>
              <span className="opacity-60">(500+ avaliações)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 p-1.5 rounded-lg">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <span className="text-gray-900 font-bold">35-45 min</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-purple-50 p-1.5 rounded-lg">
                <Bike className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-gray-900 font-bold">R$ {parseFloat(settings?.deliveryFeeKm || "1.50").toFixed(2)}</span>
              <span className="opacity-60">/ km</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-center md:justify-start">
            <div className="bg-gray-100/50 px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-gray-200/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Pedido Mínimo</span>
              <span className="text-lg font-black text-gray-900">R$ {parseFloat(settings?.minOrder || "0").toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Category ScrollBar (Premium Glass) */}
      <div className="sticky top-[64px] z-40 w-full bg-white/80 backdrop-blur-xl border-b -mx-4 px-4 py-3 shadow-sm">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-3 p-1">
            {displayCategories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                className={cn(
                  "rounded-2xl transition-all px-8 h-11 font-bold text-sm",
                  activeCategory === category.id 
                    ? "bg-red-600 text-white hover:bg-red-700 hover:text-white shadow-lg shadow-red-200 scale-105" 
                    : "text-gray-500 hover:bg-gray-100/80 hover:text-gray-900"
                )}
                onClick={() => scrollToCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </div>

      {/* Menu Sections */}
      <div className="space-y-20 mt-8">
        {featuredProducts.length > 0 && (
          <section 
            id="featured"
            ref={(el) => { categoryRefs.current['featured'] = el; }}
            className="scroll-mt-40 px-2"
          >
            <div className="flex flex-col gap-1 mb-8">
              <div className="flex items-center gap-4">
                <div className="h-10 w-2 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                  Principais Escolhas
                  <Star className="h-8 w-8 text-yellow-500 fill-yellow-500 animate-pulse" />
                </h2>
              </div>
              <p className="text-gray-400 text-sm font-medium ml-6">
                Os queridinhos da nossa cozinha
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={`featured-${product.id}`}
                  product={product} 
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
                />
              ))}
            </div>
          </section>
        )}

        {categories.map((category) => {
          const categoryProducts = products.filter(p => 
            p.categories.some((c: any) => c.categoryId === category.id)
          );

          if (categoryProducts.length === 0) return null;

          return (
            <section 
              key={category.id} 
              id={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className="scroll-mt-40 px-2"
            >
              <div className="flex flex-col gap-1 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-2 bg-red-600 rounded-full" />
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter">
                    {category.name}
                  </h2>
                </div>
                <p className="text-gray-400 text-sm font-medium ml-6">
                  {categoryProducts.length} itens disponíveis
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {categoryProducts.map((product) => (
                  <ProductCard 
                    key={`${category.id}-${product.id}`}
                    product={product} 
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
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <ProductDetailModal 
        product={selectedProduct} 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
      />

      {/* Floating Cart for Mobile (Premium Design) */}
      {mounted && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 md:hidden w-full px-6 max-w-lg">
          <CartDrawer 
            trigger={
              <button className="w-full flex items-center justify-between bg-gray-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl shadow-black/20 hover:scale-[1.02] transition-all active:scale-95 group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-4">
                  <div className="relative bg-white/20 p-2 rounded-xl">
                    <ShoppingCart className="h-6 w-6" />
                    <CartBadge />
                  </div>
                  <span className="font-bold text-lg tracking-tight">Ver pedido</span>
                </div>
                <div className="relative">
                  <CartTotal />
                </div>
              </button>
            }
          />
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onClick }: { product: any, onClick: () => void }) {
  return (
    <div 
      className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:border-red-100 transition-all duration-500 cursor-pointer flex flex-col group h-full ring-1 ring-black/[0.02]"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-50">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200">
            <StoreIcon className="h-16 w-16 opacity-10" />
          </div>
        )}
        
        {/* Discount Badge */}
        {product.originalPrice && (
          <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-red-600/20 tracking-widest uppercase">
            Promoção
          </div>
        )}

        {/* Quick Add Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 flex items-center justify-center">
          <div className="bg-white text-gray-900 px-6 py-2.5 rounded-full font-black text-xs opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-xl">
            ADICIONAR
          </div>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-black text-xl text-gray-900 line-clamp-1 group-hover:text-red-600 transition-colors tracking-tight">
          {product.name}
        </h3>
        <p className="text-gray-400 text-sm line-clamp-2 mt-2 leading-relaxed font-medium">
          {product.description}
        </p>
        
        <div className="mt-4 flex flex-wrap gap-2">
          {product.servesPeople && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full uppercase tracking-tighter">
              👤 Serve {product.servesPeople} {product.servesPeople > 1 ? 'pessoas' : 'pessoa'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-auto pt-6">
          <div className="font-black text-gray-900 text-2xl tracking-tighter">
            R$ {parseFloat(product.price).toFixed(2)}
          </div>
          {product.originalPrice && (
            <div className="text-sm text-gray-300 line-through font-bold">
              R$ {parseFloat(product.originalPrice).toFixed(2)}
            </div>
          )}
        </div>
      </div>
    </div>
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
    <span className="absolute -top-1 -right-1 bg-white text-gray-900 text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
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
    <div className="flex flex-col items-end leading-none">
      <span className="text-[10px] uppercase font-black opacity-60 tracking-widest mb-1">Total</span>
      <span className="text-xl font-black tracking-tighter">
        R$ {total.toFixed(2)}
      </span>
    </div>
  );
}
