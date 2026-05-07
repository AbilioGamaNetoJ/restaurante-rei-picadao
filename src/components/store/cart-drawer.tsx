'use client';

import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = getTotal();

  return (
    <Sheet>
      <SheetTrigger render={
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      } />
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Seu Carrinho</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>Seu carrinho está vazio.</p>
              <p className="text-sm">Adicione itens para continuar.</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.imageUrl && (
                      <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
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
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.addons.map(addon => (
                            <div key={addon.id}>
                              + {addon.quantity}x {addon.name} (R$ {addon.price.toFixed(2)})
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
          <div className="pt-4 border-t mt-auto">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-lg">Total</span>
              <span className="font-bold text-xl text-primary">
                R$ {totalValue.toFixed(2)}
              </span>
            </div>
            <SheetFooter>
              <Button render={<Link href="/checkout/endereco" />} className="w-full" size="lg">
                Avançar para o Checkout
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
