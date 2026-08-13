'use client';

import * as React from 'react';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { updateUserRole, updateEmployee, deleteEmployee } from './actions';
import Image from 'next/image';
import { Edit2, Trash2, UserCheck, UserX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type EmployeeUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
  imageUrl: string;
  role: string;
  salary: string | null | undefined;
  position: string | null | undefined;
  department: string | null | undefined;
  isActive: boolean;
  createdAt: Date | undefined;
};

// Helper functions for price formatting
const toDisplayPrice = (val: string | null | undefined) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str.replace(/\./g, ',');
};

const toBackendPrice = (val: string) => {
  if (!val) return '';
  return val.replace(/,/g, '.');
};

const sanitizeAndFormatPrice = (value: string) => {
  let clean = value.replace(/R\$\s*/gi, '');
  const lastCommaIndex = clean.lastIndexOf(',');
  const lastDotIndex = clean.lastIndexOf('.');

  if (lastCommaIndex !== -1 && lastDotIndex !== -1) {
    if (lastCommaIndex > lastDotIndex) {
      clean = clean.replace(/\./g, '');
    } else {
      clean = clean.replace(/,/g, '').replace(/\./g, ',');
    }
  } else if (lastCommaIndex === -1 && lastDotIndex !== -1) {
    clean = clean.replace(/\./g, ',');
  }

  clean = clean.replace(/[^0-9,]/g, '');

  const parts = clean.split(',');
  if (parts.length > 2) {
    clean = parts[0] + ',' + parts.slice(1).join('');
  }

  return clean;
};

const formatSalary = (salary: string | null | undefined) => {
  if (!salary) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(salary));
};

type FilterType = 'all' | 'active' | 'inactive';

export function FuncionariosClient({ users, currentRole }: { users: EmployeeUser[], currentRole: string }) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterType>('all');
  const [editDialog, setEditDialog] = useState<{ open: boolean; user: EmployeeUser | null }>({ open: false, user: null });

  const [formData, setFormData] = useState({
    position: '',
    department: '',
    salary: '',
    role: '',
    isActive: true,
  });

  const filteredUsers = users.filter(user => {
    if (filter === 'active') return user.isActive !== false;
    if (filter === 'inactive') return user.isActive === false;
    return true;
  });

  const handleOpenEdit = (user: EmployeeUser) => {
    setEditDialog({ open: true, user });
    setFormData({
      position: user.position || '',
      department: user.department || '',
      salary: toDisplayPrice(user.salary),
      role: user.role,
      isActive: user.isActive !== false,
    });
  };

  const handleCloseEdit = () => {
    setEditDialog({ open: false, user: null });
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDialog.user) return;
    const user = editDialog.user;

    startTransition(async () => {
      try {
        // Atualizar role se mudou
        if (formData.role !== user.role) {
          await updateUserRole(user.id, formData.role);
        }

        // Atualizar outros campos
        await updateEmployee(user.id, {
          position: formData.position || null,
          department: formData.department || null,
          salary: toBackendPrice(formData.salary) || null,
          isActive: formData.isActive,
        });

        toast.success('Funcionário atualizado com sucesso!', { style: { color: '#16a34a' } });
        handleCloseEdit();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao atualizar funcionário';
        toast.error(message, { style: { color: '#dc2626' } });
      }
    });
  };

  const handleDelete = (userId: string) => {
    if (!confirm('Deseja realmente excluir este funcionário? Ele voltará a ser apenas um cliente.')) return;

    startTransition(async () => {
      try {
        await deleteEmployee(userId);
        toast.success('Funcionário excluído com sucesso!', { style: { color: '#16a34a' } });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao excluir funcionário';
        toast.error(message, { style: { color: '#dc2626' } });
      }
    });
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      dono: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
      gerente: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      funcionario: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      cliente: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
    };
    return variants[role] || variants.cliente;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      dono: 'Dono',
      gerente: 'Gerente',
      funcionario: 'Funcionário',
      cliente: 'Cliente',
    };
    return labels[role] || 'Cliente';
  };

  return (
    <div className="space-y-4">
      {/* Filtros e info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            <UserCheck className="h-4 w-4 mr-1" /> Ativos
          </Button>
          <Button
            variant={filter === 'inactive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('inactive')}
          >
            <UserX className="h-4 w-4 mr-1" /> Inativos
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'funcionário' : 'funcionários'}
        </p>
      </div>

      {/* Tabela / Lista Mobile */}
      <div className="rounded-md border bg-white overflow-hidden">
        
        {/* Mobile View (Cards) */}
        <div className="block lg:hidden divide-y">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Nenhum funcionário encontrado.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 relative rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                      {user.imageUrl ? (
                        <Image src={user.imageUrl} alt={user.firstName || ''} fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                          {user.firstName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(user)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {currentRole === 'dono' && user.role !== 'dono' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Cargo</p>
                    <p className="font-medium">{user.position || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Setor</p>
                    <p className="font-medium">{user.department || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Salário</p>
                    <p className="font-medium">{user.salary ? <span className="text-emerald-600">{formatSalary(user.salary)}</span> : '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Acesso & Status</p>
                    <div className="flex flex-wrap gap-1">
                      <Badge className={getRoleBadge(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      {user.isActive !== false ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Inativo
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b whitespace-nowrap">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Nome</th>
                <th className="text-left px-4 py-3 font-semibold">Cargo</th>
                <th className="text-left px-4 py-3 font-semibold">Setor</th>
                <th className="text-left px-4 py-3 font-semibold">Acesso</th>
                <th className="text-left px-4 py-3 font-semibold">Salário</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold w-[100px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 relative rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                          {user.imageUrl ? (
                            <Image src={user.imageUrl} alt={user.firstName || ''} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                              {user.firstName?.charAt(0) || user.email?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="truncate max-w-[150px]">
                        {user.position || <span className="text-muted-foreground">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="truncate max-w-[150px]">
                        {user.department || <span className="text-muted-foreground">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge className={getRoleBadge(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.salary ? (
                        <span className="font-semibold text-emerald-600">{formatSalary(user.salary)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {user.isActive !== false ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Inativo
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(user)}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {currentRole === 'dono' && user.role !== 'dono' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(user.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Nota: Para adicionar novos funcionários, eles precisam se cadastrar na loja como clientes primeiro. Depois, você pode alterar o nível de acesso, salário, cargo e setor deles aqui.
      </p>

      {/* Dialog de Edição */}
      <Dialog open={editDialog.open} onOpenChange={(open) => !open && handleCloseEdit()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            {editDialog.user && (
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="h-12 w-12 relative rounded-full overflow-hidden bg-slate-100">
                  {editDialog.user.imageUrl ? (
                    <Image src={editDialog.user.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                      {editDialog.user.firstName?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{editDialog.user.firstName} {editDialog.user.lastName}</p>
                  <p className="text-sm text-muted-foreground">{editDialog.user.email}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  placeholder="Ex: Vendedor"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Setor</Label>
                <Input
                  id="department"
                  placeholder="Ex: Vendas"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salário (R$)</Label>
              <Input
                id="salary"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 2.500,00"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: sanitizeAndFormatPrice(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Nível de Acesso</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={currentRole === 'gerente' && ['dono', 'gerente'].includes(formData.role)}
              >
                <option value="cliente">Cliente (Sem acesso)</option>
                <option value="funcionario">Funcionário</option>
                {currentRole === 'dono' && <option value="gerente">Gerente</option>}
                {currentRole === 'dono' && <option value="dono">Dono</option>}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Funcionário Ativo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseEdit}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
