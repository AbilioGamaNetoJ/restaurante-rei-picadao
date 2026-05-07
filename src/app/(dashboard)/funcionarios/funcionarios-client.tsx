'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { updateUserRole } from './actions';
import Image from 'next/image';

export function FuncionariosClient({ users, currentRole }: { users: any[], currentRole: string }) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole);
        toast.success('Nível de acesso atualizado');
      } catch (error: any) {
        toast.error(error.message || 'Erro ao atualizar nível de acesso');
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {users.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">Nenhum usuário encontrado.</div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 relative rounded-full overflow-hidden bg-slate-100">
                      {user.imageUrl ? (
                        <Image src={user.imageUrl} alt={user.firstName || ''} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">Sem foto</div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <select
                      className="flex h-10 w-full sm:w-auto rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
                      value={user.role as string}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={isPending || (currentRole === 'gerente' && ['dono', 'gerente'].includes(user.role as string))}
                    >
                      <option value="cliente">Cliente (Sem acesso)</option>
                      <option value="funcionario">Funcionário</option>
                      {currentRole === 'dono' && <option value="gerente">Gerente</option>}
                      {currentRole === 'dono' && <option value="dono">Dono</option>}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      <p className="text-sm text-muted-foreground">
        Nota: Para adicionar novos funcionários, eles precisam se cadastrar na loja como clientes primeiro. Depois, você pode alterar o nível de acesso deles aqui.
      </p>
    </div>
  );
}
