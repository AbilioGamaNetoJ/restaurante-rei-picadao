'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const { signOut } = useClerk();

  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center justify-start gap-2"
      onClick={() => signOut({ redirectUrl: '/' })}
    >
      <LogOut className="h-4 w-4" />
      Sair do sistema
    </Button>
  );
}
