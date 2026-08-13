import { describe, it, expect } from 'vitest';
import { checkoutRequestSchema, toCents, formatCents, getAddressHash, getCheckoutIdentityHash } from './checkout';

const validAddress = {
  customerName: 'João Silva',
  customerEmail: 'joao@example.com',
  customerPhone: '48999999999',
  customerCpfCnpj: '12345678901',
  addressStreet: 'Rua das Flores',
  addressNumber: '123',
  addressNeighborhood: 'Centro',
  addressCity: 'São José',
  addressState: 'SC',
  addressZip: '88110000',
};

const validItem = {
  productId: '550e8400-e29b-41d4-a716-446655440000',
  quantity: 2,
  addons: [],
};

describe('Checkout Schema: Price Tamper Resistance', () => {
  const basePayload = {
    items: [validItem],
    checkoutData: validAddress,
    deliveryQuoteId: '550e8400-e29b-41d4-a716-446655440001',
    billingType: 'PIX' as const,
  };

  it('accepts a valid payload', () => {
    const result = checkoutRequestSchema.safeParse(basePayload);
    expect(result.success).toBe(true);
  });

  it('rejects payload with injected price field on items', () => {
    const tampered = {
      ...basePayload,
      items: [{ ...validItem, price: 0.01 }],
    };
    expect(checkoutRequestSchema.safeParse(tampered).success).toBe(false);
  });

  it('rejects payload with injected subtotal field', () => {
    const tampered = {
      ...basePayload,
      items: [{ ...validItem, subtotal: 0.01 }],
    };
    expect(checkoutRequestSchema.safeParse(tampered).success).toBe(false);
  });

  it('rejects payload with injected total field', () => {
    const tampered = {
      ...basePayload,
      total: 0.01,
    };
    expect(checkoutRequestSchema.safeParse(tampered).success).toBe(false);
  });

  it('rejects payload with injected deliveryFee field', () => {
    const tampered = {
      ...basePayload,
      deliveryFee: 0.01,
    };
    expect(checkoutRequestSchema.safeParse(tampered).success).toBe(false);
  });

  it('rejects payload with unknown top-level keys (.strict())', () => {
    const tampered = {
      ...basePayload,
      extraField: 'malicious',
    };
    expect(checkoutRequestSchema.safeParse(tampered).success).toBe(false);
  });

  it('rejects quantity exceeding max (20)', () => {
    const tampered = {
      ...basePayload,
      items: [{ ...validItem, quantity: 21 }],
    };
    expect(checkoutRequestSchema.safeParse(tampered).success).toBe(false);
  });

  it('rejects quantity of zero or negative', () => {
    expect(checkoutRequestSchema.safeParse({
      ...basePayload,
      items: [{ ...validItem, quantity: 0 }],
    }).success).toBe(false);
    expect(checkoutRequestSchema.safeParse({
      ...basePayload,
      items: [{ ...validItem, quantity: -1 }],
    }).success).toBe(false);
  });

  it('rejects more than 20 items', () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      ...validItem,
      productId: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
    }));
    expect(checkoutRequestSchema.safeParse({ ...basePayload, items }).success).toBe(false);
  });

  it('rejects non-UUID productId', () => {
    expect(checkoutRequestSchema.safeParse({
      ...basePayload,
      items: [{ ...validItem, productId: 'not-a-uuid' }],
    }).success).toBe(false);
  });

  it('rejects invalid billingType', () => {
    expect(checkoutRequestSchema.safeParse({
      ...basePayload,
      billingType: 'BOLETO',
    }).success).toBe(false);
  });

  it('strips comment from persisted cart (validation accepts max 500 chars)', () => {
    expect(checkoutRequestSchema.safeParse({
      ...basePayload,
      items: [{ ...validItem, comment: 'a'.repeat(501) }],
    }).success).toBe(false);
    expect(checkoutRequestSchema.safeParse({
      ...basePayload,
      items: [{ ...validItem, comment: 'Sem cebola' }],
    }).success).toBe(true);
  });
});

describe('Address Validation', () => {
  it('rejects CPF with invalid length', () => {
    const bad = { ...validAddress, customerCpfCnpj: '123' };
    expect(checkoutRequestSchema.safeParse({
      items: [validItem],
      checkoutData: bad,
      deliveryQuoteId: '550e8400-e29b-41d4-a716-446655440001',
      billingType: 'PIX',
    }).success).toBe(false);
  });

  it('normalizes phone to digits only (accepts formatted input)', () => {
    const formatted = { ...validAddress, customerPhone: '(48) 99999-9999' };
    const result = checkoutRequestSchema.safeParse({
      items: [validItem],
      checkoutData: formatted,
      deliveryQuoteId: '550e8400-e29b-41d4-a716-446655440001',
      billingType: 'PIX',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.checkoutData.customerPhone).toBe('48999999999');
    }
  });

  it('rejects invalid email', () => {
    const bad = { ...validAddress, customerEmail: 'not-an-email' };
    expect(checkoutRequestSchema.safeParse({
      items: [validItem],
      checkoutData: bad,
      deliveryQuoteId: '550e8400-e29b-41d4-a716-446655440001',
      billingType: 'PIX',
    }).success).toBe(false);
  });
});

describe('Monetary Helpers', () => {
  it('toCents converts string values correctly', () => {
    expect(toCents('45.00')).toBe(4500);
    expect(toCents('0.01')).toBe(1);
    expect(toCents('999.99')).toBe(99999);
  });

  it('toCents handles numeric input', () => {
    expect(toCents(45)).toBe(4500);
    expect(toCents(0.01)).toBe(1);
  });

  it('toCents rejects negative values', () => {
    expect(() => toCents(-1)).toThrow();
    expect(() => toCents('-0.01')).toThrow();
  });

  it('formatCents converts back correctly', () => {
    expect(formatCents(4500)).toBe('45.00');
    expect(formatCents(1)).toBe('0.01');
    expect(formatCents(99999)).toBe('999.99');
  });

  it('toCents and formatCents are inverse operations', () => {
    expect(formatCents(toCents('42.50'))).toBe('42.50');
  });
});

describe('Hash Functions', () => {
  it('getAddressHash is deterministic', () => {
    const hash1 = getAddressHash(validAddress);
    const hash2 = getAddressHash(validAddress);
    expect(hash1).toBe(hash2);
  });

  it('getAddressHash differs for different addresses', () => {
    const hash1 = getAddressHash(validAddress);
    const hash2 = getAddressHash({ ...validAddress, addressNumber: '456' });
    expect(hash1).not.toBe(hash2);
  });

  it('getCheckoutIdentityHash is deterministic', () => {
    const h1 = getCheckoutIdentityHash('joao@example.com', '48999999999');
    const h2 = getCheckoutIdentityHash('joao@example.com', '48999999999');
    expect(h1).toBe(h2);
  });

  it('getCheckoutIdentityHash normalizes email case', () => {
    const h1 = getCheckoutIdentityHash('JOAO@EXAMPLE.COM', '48999999999');
    const h2 = getCheckoutIdentityHash('joao@example.com', '48999999999');
    expect(h1).toBe(h2);
  });
});
