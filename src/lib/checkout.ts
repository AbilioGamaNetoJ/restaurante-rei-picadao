import { createHash } from 'crypto';
import { z } from 'zod';

const MAX_ORDER_ITEMS = 20;
const MAX_ITEM_QUANTITY = 20;
const MAX_ADDONS_PER_ITEM = 20;

const checkoutAddressSchema = z.object({
  customerName: z.string().trim().min(3).max(120),
  customerEmail: z.string().trim().toLowerCase().email().max(254),
  customerPhone: z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().length(11)),
  customerCpfCnpj: z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().refine((value) => [11, 14].includes(value.length))),
  addressStreet: z.string().trim().min(3).max(160),
  addressNumber: z.string().trim().min(1).max(20),
  addressComplement: z.string().trim().max(100).optional(),
  addressNeighborhood: z.string().trim().min(2).max(120),
  addressCity: z.string().trim().min(2).max(120),
  addressState: z.string().trim().toUpperCase().pipe(z.string().regex(/^[A-Z]{2}$/)),
  addressZip: z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().length(8)),
}).strict();

export const freightRequestSchema = checkoutAddressSchema.pick({
  addressStreet: true,
  addressNumber: true,
  addressNeighborhood: true,
  addressCity: true,
  addressState: true,
  addressZip: true,
});

export const checkoutRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
    comment: z.string().trim().max(500).optional(),
    addons: z.array(z.object({
      id: z.string().uuid(),
      quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
    }).strict()).max(MAX_ADDONS_PER_ITEM).default([]),
  }).strict()).min(1).max(MAX_ORDER_ITEMS),
  checkoutData: checkoutAddressSchema,
  deliveryQuoteId: z.string().uuid(),
  billingType: z.enum(['PIX', 'CREDIT_CARD']),
}).strict();

type DeliveryAddress = z.infer<typeof freightRequestSchema>;

export function getAddressHash(address: DeliveryAddress) {
  const normalizedAddress = [
    address.addressStreet,
    address.addressNumber,
    address.addressNeighborhood,
    address.addressCity,
    address.addressState,
    address.addressZip,
  ].map((value) => value.trim().toLocaleLowerCase('pt-BR')).join('|');

  return createHash('sha256').update(normalizedAddress).digest('hex');
}

export function getCheckoutIdentityHash(email: string, phone: string) {
  return createHash('sha256')
    .update(`${email.trim().toLocaleLowerCase('pt-BR')}|${phone.replace(/\D/g, '')}`)
    .digest('hex');
}

export function toCents(value: string | number) {
  const cents = Math.round(Number(value) * 100);

  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error('Invalid monetary value');
  }

  return cents;
}

export function formatCents(cents: number) {
  return (cents / 100).toFixed(2);
}
