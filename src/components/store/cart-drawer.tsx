'use client';
import * as React from 'react';
import { useEffect, useState } from 'react';

import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";


export function CartDrawer({ trigger }: { trigger?: React.ReactElement }) {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, getTotal, isDrawerOpen, setDrawerOpen } = useCartStore();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = getTotal();

  const defaultTrigger = (
    <button
      className="relative inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
    >
      <ShoppingCart className="h-5 w-5" />
      {mounted && totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
          {totalItems}
        </span>
      )}
    </button>
  );


  return (
    <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <SheetTrigger render={trigger || defaultTrigger} nativeButton={true} onClick={() => setDrawerOpen(true)} />
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader className="border-b">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle className="text-lg font-bold">Seu Carrinho</SheetTitle>
            {mounted && items.length > 0 && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden py-4 px-4">
          {!mounted ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <div className="h-12 w-12 mb-4 animate-pulse bg-muted rounded-full" />
              <p>Carregando...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>Seu carrinho está vazio.</p>
              <p className="text-sm">Adicione itens para continuar.</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-lg border bg-card p-3">
                    {item.imageUrl && (
                      <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 border border-border/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium leading-none">{item.name}</h4>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        R$ {item.price.toFixed(2)}
                      </div>
                      
                      {item.addons.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {item.addons.map(addon => (
                            <div key={addon.id} className="flex items-center gap-2">
                              {addon.imageUrl && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img 
                                  src={addon.imageUrl} 
                                  alt={addon.name} 
                                  className="w-8 h-8 rounded object-cover flex-shrink-0" 
                                />
                              )}
                              <div className="text-[11px] text-muted-foreground leading-tight">
                                <span className="font-medium text-foreground">{addon.quantity}x</span> {addon.name}
                                <span className="ml-1 text-[10px]">(R$ {addon.price.toFixed(2)})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {item.comment && (
                        <div className="text-xs text-muted-foreground italic mt-1">
                          Obs: {item.comment}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center space-x-2 border rounded-md px-2 py-1">
                          <button 
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="font-medium text-sm">
                          R$ {item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {items.length > 0 && (
          <div className="mt-auto border-t px-4 pt-4 pb-4 space-y-3">
            <div className="rounded-lg border bg-card px-4 py-3 flex justify-between items-center">
              <span className="font-semibold text-base">Total</span>
              <span className="font-black text-xl text-primary">
                R$ {totalValue.toFixed(2)}
              </span>
            </div>
            <Button
              render={<Link href="/checkout/endereco" />}
              className="w-full"
              size="lg"
              nativeButton={false}
              onClick={() => setDrawerOpen(false)}
            >
              Avançar para o Checkout
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
