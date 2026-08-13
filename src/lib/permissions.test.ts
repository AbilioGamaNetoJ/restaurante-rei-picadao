import { describe, it, expect } from 'vitest';
import { can, getRoleFromClaims, isRole, type PermissionAction } from './permissions';

const ALL_PERMISSIONS: PermissionAction[] = [
  'access_dashboard', 'view_metrics', 'manage_staff', 'view_finance',
  'manage_finance', 'manage_products', 'manage_categories', 'view_orders',
  'manage_orders', 'cancel_orders', 'delete_orders', 'edit_settings',
];

describe('RBAC: can()', () => {
  describe('dono (owner)', () => {
    it('has all permissions', () => {
      for (const action of ALL_PERMISSIONS) {
        expect(can('dono', action)).toBe(true);
      }
    });
  });

  describe('gerente (manager)', () => {
    const allowed: PermissionAction[] = [
      'access_dashboard', 'manage_products', 'manage_categories',
      'view_orders', 'manage_orders', 'cancel_orders',
    ];

    it('has exactly the allowed permissions', () => {
      for (const action of ALL_PERMISSIONS) {
        const expected = allowed.includes(action);
        expect(can('gerente', action)).toBe(expected);
      }
    });

    it('cannot access finance', () => {
      expect(can('gerente', 'view_finance')).toBe(false);
      expect(can('gerente', 'manage_finance')).toBe(false);
    });

    it('cannot manage staff', () => {
      expect(can('gerente', 'manage_staff')).toBe(false);
    });

    it('cannot delete orders', () => {
      expect(can('gerente', 'delete_orders')).toBe(false);
    });

    it('cannot edit settings', () => {
      expect(can('gerente', 'edit_settings')).toBe(false);
    });
  });

  describe('funcionario (employee)', () => {
    const allowed: PermissionAction[] = [
      'access_dashboard', 'view_orders', 'manage_orders',
    ];

    it('has exactly the allowed permissions', () => {
      for (const action of ALL_PERMISSIONS) {
        const expected = allowed.includes(action);
        expect(can('funcionario', action)).toBe(expected);
      }
    });

    it('cannot cancel orders', () => {
      expect(can('funcionario', 'cancel_orders')).toBe(false);
    });

    it('cannot manage products', () => {
      expect(can('funcionario', 'manage_products')).toBe(false);
    });
  });

  describe('cliente', () => {
    it('has no permissions', () => {
      for (const action of ALL_PERMISSIONS) {
        expect(can('cliente', action)).toBe(false);
      }
    });
  });

  describe('invalid roles', () => {
    it('rejects undefined', () => {
      expect(can(undefined, 'view_orders')).toBe(false);
    });

    it('rejects null', () => {
      expect(can(null, 'view_orders')).toBe(false);
    });

    it('rejects unknown role strings', () => {
      expect(can('admin' as never, 'view_orders')).toBe(false);
      expect(can('', 'view_orders')).toBe(false);
      expect(can('DONO', 'view_orders')).toBe(false);
    });
  });
});

describe('isRole()', () => {
  it('accepts valid roles', () => {
    expect(isRole('dono')).toBe(true);
    expect(isRole('gerente')).toBe(true);
    expect(isRole('funcionario')).toBe(true);
    expect(isRole('cliente')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isRole(undefined)).toBe(false);
    expect(isRole(null)).toBe(false);
    expect(isRole('')).toBe(false);
    expect(isRole('admin')).toBe(false);
    expect(isRole(123)).toBe(false);
    expect(isRole({})).toBe(false);
  });
});

describe('getRoleFromClaims()', () => {
  it('extracts role from valid metadata', () => {
    const claims = { metadata: { role: 'dono' } };
    expect(getRoleFromClaims(claims)).toBe('dono');
  });

  it('returns null for missing metadata', () => {
    expect(getRoleFromClaims({})).toBeNull();
    expect(getRoleFromClaims(null)).toBeNull();
    expect(getRoleFromClaims(undefined)).toBeNull();
  });

  it('returns null for missing role in metadata', () => {
    expect(getRoleFromClaims({ metadata: {} })).toBeNull();
    expect(getRoleFromClaims({ metadata: { foo: 'bar' } })).toBeNull();
  });

  it('returns null for invalid role value', () => {
    expect(getRoleFromClaims({ metadata: { role: 'admin' } })).toBeNull();
    expect(getRoleFromClaims({ metadata: { role: null } })).toBeNull();
    expect(getRoleFromClaims({ metadata: { role: 123 } })).toBeNull();
  });

  it('returns null for non-object claims', () => {
    expect(getRoleFromClaims('string')).toBeNull();
    expect(getRoleFromClaims(42)).toBeNull();
  });
});
