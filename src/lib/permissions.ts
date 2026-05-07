export type Role = 'dono' | 'gerente' | 'funcionario' | 'cliente';

export type PermissionAction = 
  | 'access_dashboard' 
  | 'view_metrics'
  | 'manage_staff' 
  | 'view_finance' 
  | 'manage_products' 
  | 'manage_categories' 
  | 'view_orders' 
  | 'manage_orders' 
  | 'edit_settings';

const ROLES_PERMISSIONS: Record<Role, PermissionAction[]> = {
  dono: [
    'access_dashboard',
    'view_metrics',
    'manage_staff',
    'view_finance',
    'manage_products',
    'manage_categories',
    'view_orders',
    'manage_orders',
    'edit_settings'
  ],
  gerente: [
    'access_dashboard',
    'manage_products',
    'manage_categories',
    'view_orders',
    'manage_orders'
  ],
  funcionario: [
    'access_dashboard',
    'view_orders',
    'manage_orders'
  ],
  cliente: []
};

export function can(role: string | undefined | null, action: PermissionAction): boolean {
  if (!role) return false;
  const typedRole = role as Role;
  
  return ROLES_PERMISSIONS[typedRole]?.includes(action) ?? false;
}
