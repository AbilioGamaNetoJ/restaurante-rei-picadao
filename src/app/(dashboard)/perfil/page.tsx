import * as React from 'react';
import { UserProfile } from '@clerk/nextjs';

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Meu Perfil</h2>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e credenciais de acesso.
        </p>
      </div>
      <div className="flex justify-center py-4">
        <UserProfile 
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full flex justify-center",
              card: "shadow-sm border border-slate-200 dark:border-slate-800 w-full max-w-3xl",
            }
          }}
        />
      </div>
    </div>
  );
}
