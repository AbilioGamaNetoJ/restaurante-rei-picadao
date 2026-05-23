'use client';

import * as React from 'react';


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface ClosedStoreDialogProps {
  isOpenStatus: boolean;
}

export function ClosedStoreDialog({ isOpenStatus }: ClosedStoreDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isOpenStatus) {
      const timer = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isOpenStatus]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estamos Fechados 😴</DialogTitle>
          <DialogDescription>
            No momento nosso delivery está fechado. Você pode visualizar nosso cardápio, mas não será possível finalizar pedidos agora. Confira nossos horários de funcionamento!
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
