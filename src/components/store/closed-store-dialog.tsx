'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StoreHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
}

interface ClosedStoreDialogProps {
  isOpenStatus: boolean;
  hours?: StoreHour[];
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatTime(time: string) {
  return time.slice(0, 5);
}

function groupHoursByDay(hours: StoreHour[]) {
  const grouped: Record<number, StoreHour[]> = {};
  for (const h of hours) {
    if (!grouped[h.dayOfWeek]) grouped[h.dayOfWeek] = [];
    grouped[h.dayOfWeek].push(h);
  }
  return grouped;
}

export function ClosedStoreDialog({ isOpenStatus, hours = [] }: Readonly<ClosedStoreDialogProps>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isOpenStatus) {
      const timer = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpenStatus]);

  const grouped = groupHoursByDay(hours);
  const today = new Date().getDay();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0 overflow-hidden gap-0"
      >
        {/* Header vermelho — só título e ícone, sem texto pequeno */}
        <div className="relative bg-red-700 px-6 py-5 text-white">
          <DialogClose
            nativeButton={true}
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 text-white hover:bg-white/20 hover:text-white"
              />
            }
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Clock className="h-7 w-7" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white leading-tight">
                Estamos Fechados 😴
              </DialogTitle>
              <p className="text-white/70 text-sm mt-0.5 font-medium">Delivery temporariamente indisponível</p>
            </div>
          </div>
        </div>

        {/* Descrição na área branca — fácil de ler */}
        <div className="px-6 pt-5 pb-1">
          <DialogDescription className="text-base text-foreground leading-relaxed">
            No momento nosso delivery está fechado. Você pode visualizar nosso cardápio, mas não será possível finalizar pedidos agora.
          </DialogDescription>
        </div>

        {/* Horários de funcionamento */}
        {hours.length > 0 && (
          <div className="px-6 py-5 border-b">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Horários de Funcionamento
            </h3>
            <div className="space-y-1">
              {([1, 2, 3, 4, 5, 6, 0] as number[]).map(day => {
                const dayHours = grouped[day];
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                      isToday
                        ? "bg-red-50 font-semibold text-red-700 ring-1 ring-red-200"
                        : "text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{DAYS[day]}</span>
                      {isToday && (
                        <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-normal text-white">
                          hoje
                        </span>
                      )}
                    </div>
                    {dayHours ? (
                      <span>
                        {dayHours
                          .map(h => `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}`)
                          .join(' | ')}
                      </span>
                    ) : (
                      <span className="italic opacity-50">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4">
          <DialogClose
            nativeButton={true}
            render={
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" />
            }
          >
            Entendido, vou aguardar!
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
