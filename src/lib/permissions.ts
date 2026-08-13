export type Role = 'dono' | 'gerente' | 'funcionario' | 'cliente';

export type PermissionAction =
  | 'access_dashboard'
  | 'view_metrics'
  | 'manage_staff'
  | 'view_finance'
  | 'manage_finance'
  | 'manage_products'
  | 'manage_categories'
  | 'view_orders'
  | 'manage_orders'
  | 'cancel_orders'
  | 'delete_orders'
  | 'edit_settings';

const ROLES_PERMISSIONS: Record<Role, PermissionAction[]> = {
  dono: [
    'access_dashboard',
    'view_metrics',
    'manage_staff',
    'view_finance',
    'manage_finance',
    'manage_products',
    'manage_categories',
    'view_orders',
    'manage_orders',
    'cancel_orders',
    'delete_orders',
    'edit_settings'
  ],
  gerente: [
    'access_dashboard',
    'manage_products',
    'manage_categories',
    'view_orders',
    'manage_orders',
    'cancel_orders'
  ],
  funcionario: [
    'access_dashboard',
    'view_orders',
    'manage_orders'
  ],
  cliente: []
};

export function can(role: string | undefined | null, action: PermissionAction): boolean {
  return isRole(role) && ROLES_PERMISSIONS[role].includes(action);
}

export function isRole(role: unknown): role is Role {
  return typeof role === 'string' && role in ROLES_PERMISSIONS;
}

export function getRoleFromClaims(sessionClaims: unknown): Role | null {
  if (!sessionClaims || typeof sessionClaims !== 'object') return null;

  const metadata = (sessionClaims as Record<string, unknown>).metadata;
  if (!metadata || typeof metadata !== 'object') return null;

  const role = (metadata as Record<string, unknown>).role;
  return isRole(role) ? role : null;
}
