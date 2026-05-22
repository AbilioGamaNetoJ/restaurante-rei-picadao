'use client';

import * as React from 'react';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 border-red-200 bg-red-50/30 shadow-sm transition-all duration-300 hover:bg-red-100/80 hover:text-red-700 hover:border-red-300 hover:shadow-md group rounded-md h-auto"
      onClick={() => signOut({ redirectUrl: '/' })}
    >
      <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
      Sair do sistema
    </Button>
  );
}
