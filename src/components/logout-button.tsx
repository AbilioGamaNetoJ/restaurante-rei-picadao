'use client';

import * as React from 'react';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LogoutButton({ isCollapsed }: { isCollapsed?: boolean }) {
  const { signOut } = useClerk();

  return (
    <Button 
      variant="outline" 
      className={cn(
        "flex items-center justify-center transition-all duration-300 text-red-600 border-red-200 bg-red-50/30 hover:bg-red-100/80 hover:text-red-700 hover:border-red-300 shadow-sm hover:shadow-md group rounded-md h-auto",
        isCollapsed ? "w-10 h-10 p-0" : "w-full gap-2 px-3 py-2.5 text-sm font-medium"
      )}
      onClick={() => signOut({ redirectUrl: '/' })}
      title={isCollapsed ? "Sair do sistema" : undefined}
    >
      <LogOut className={cn(
        "transition-transform duration-300",
        isCollapsed ? "h-5 w-5" : "h-4 w-4 group-hover:-translate-x-1"
      )} />
      {!isCollapsed && <span>Sair do sistema</span>}
    </Button>
  );
}
