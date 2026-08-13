import { NextResponse } from 'next/server';
import { and, eq, gt, inArray, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { deliveryQuotes, orderItemAddons, orderItems, orders, products } from '@/db/schema';
import { checkoutRequestSchema, formatCents, getAddressHash, getCheckoutIdentityHash, toCents } from '@/lib/checkout';
import { createAsaasCustomer, createCheckout } from '@/lib/asaas';
import { createTrackingToken } from '@/lib/order-tracking';
import { checkRateLimit, createRateLimitHeaders, getRequestIp } from '@/lib/rate-limit';
import { originGuard } from '@/lib/origin-guard';

type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
type CheckoutItem = CheckoutRequest['items'][number];
type CheckoutData = CheckoutRequest['checkoutData'];

type ProductAddon = {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
  isAvailable: boolean;
};

type ProductForCheckout = {
  id: string;
  name: string;
  price: string;
  addons: Array<{ addon: ProductAddon | null }>;
};

type DeliveryQuoteForCheckout = {
  distanceKm: string;
  deliveryFee: string;
};

type CheckoutResources = {
  quote: DeliveryQuoteForCheckout | undefined;
  availableProducts: ProductForCheckout[];
  settings: { minOrder: string } | undefined;
};

type OrderAddonToInsert = {
  addonId: string;
  addonName: string;
  addonPrice: string;
  quantity: number;
  imageUrl: string | null;
};

type OrderItemToInsert = {
  productId: string;
  productName: string;
  productPrice: string;
  quantity: number;
  comment?: string;
  subtotal: string;
  addons: OrderAddonToInsert[];
};

class CheckoutError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function loadCheckoutResources(
  items: CheckoutRequest['items'],
  checkoutData: CheckoutData,
  deliveryQuoteId: string,
): Promise<CheckoutResources> {
  const productIds = [...new Set(items.map((item) => item.productId))];
  const [quote, availableProducts, settings] = await Promise.all([
    db.query.deliveryQuotes.findFirst({
      where: and(
        eq(deliveryQuotes.id, deliveryQuoteId),
        eq(deliveryQuotes.addressHash, getAddressHash(checkoutData)),
        gt(deliveryQuotes.expiresAt, new Date()),
        isNull(deliveryQuotes.consumedAt),
      ),
    }),
    db.query.products.findMany({
      where: and(inArray(products.id, productIds), eq(products.isAvailable, true)),
      columns: { id: true, name: true, price: true },
      with: {
        addons: {
          with: {
            addon: {
              columns: { id: true, name: true, price: true, imageUrl: true, isAvailable: true },
            },
          },
        },
      },
    }),
    db.query.storeSettings.findFirst({ columns: { minOrder: true } }),
  ]);

  return { quote, availableProducts, settings };
}

function buildOrderAddons(requestedAddons: CheckoutItem['addons'], product: ProductForCheckout) {
  const addonsById = new Map(
    product.addons
      .map((relation) => relation.addon)
      .filter((addon): addon is ProductAddon => Boolean(addon?.isAvailable))
      .map((addon) => [addon.id, addon]),
  );
  const seenAddonIds = new Set<string>();
  const addons: OrderAddonToInsert[] = [];
  let addonsCents = 0;

  for (const requestedAddon of requestedAddons) {
    if (seenAddonIds.has(requestedAddon.id)) {
      throw new CheckoutError(400, 'Adicional duplicado no pedido.');
    }

    const addon = addonsById.get(requestedAddon.id);
    if (!addon) {
      throw new CheckoutError(409, 'Adicional inválido ou indisponível.');
    }

    seenAddonIds.add(addon.id);
    const addonPriceCents = toCents(addon.price);
    addonsCents += addonPriceCents * requestedAddon.quantity;
    addons.push({
      addonId: addon.id,
      addonName: addon.name,
      addonPrice: formatCents(addonPriceCents),
      quantity: requestedAddon.quantity,
      imageUrl: addon.imageUrl,
    });
  }

  return { addons, addonsCents };
}

function buildOrderItems(items: CheckoutRequest['items'], availableProducts: ProductForCheckout[]) {
  const productById = new Map(availableProducts.map((product) => [product.id, product]));
  const itemsToInsert: OrderItemToInsert[] = [];
  let subtotalCents = 0;

  for (const requestedItem of items) {
    const product = productById.get(requestedItem.productId);
    if (!product) {
      throw new CheckoutError(409, 'Produto indisponível.');
    }

    const { addons, addonsCents } = buildOrderAddons(requestedItem.addons, product);
    const productPriceCents = toCents(product.price);
    const itemSubtotalCents = productPriceCents * requestedItem.quantity + addonsCents;
    subtotalCents += itemSubtotalCents;
    itemsToInsert.push({
      productId: product.id,
      productName: product.name,
      productPrice: formatCents(productPriceCents),
      quantity: requestedItem.quantity,
      comment: requestedItem.comment,
      subtotal: formatCents(itemSubtotalCents),
      addons,
    });
  }

  return { itemsToInsert, subtotalCents };
}

async function insertPendingOrder({
  orderId,
  checkoutData,
  deliveryQuoteId,
  quote,
  subtotalCents,
  deliveryFeeCents,
  totalCents,
  trackingHash,
  trackingExpiresAt,
  items,
}: {
  orderId: string;
  checkoutData: CheckoutData;
  deliveryQuoteId: string;
  quote: DeliveryQuoteForCheckout;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  trackingHash: string;
  trackingExpiresAt: Date;
  items: OrderItemToInsert[];
}) {
  await db.transaction(async (transaction) => {
    await transaction.update(deliveryQuotes)
      .set({ consumedAt: new Date() })
      .where(and(eq(deliveryQuotes.id, deliveryQuoteId), isNull(deliveryQuotes.consumedAt)));

    await transaction.insert(orders).values({
      id: orderId,
      customerName: checkoutData.customerName,
      customerEmail: checkoutData.customerEmail,
      customerPhone: checkoutData.customerPhone,
      addressStreet: checkoutData.addressStreet,
      addressNumber: checkoutData.addressNumber,
      addressComplement: checkoutData.addressComplement,
      addressNeighborhood: checkoutData.addressNeighborhood,
      addressCity: checkoutData.addressCity,
      addressState: checkoutData.addressState,
      addressZip: checkoutData.addressZip,
      distanceKm: quote.distanceKm,
      deliveryFee: formatCents(deliveryFeeCents),
      subtotal: formatCents(subtotalCents),
      total: formatCents(totalCents),
      status: 'pending',
      trackingTokenHash: trackingHash,
      trackingTokenExpiresAt: trackingExpiresAt,
    });

    for (const item of items) {
      const [insertedItem] = await transaction.insert(orderItems).values({
        orderId,
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
        comment: item.comment,
        subtotal: item.subtotal,
      }).returning({ id: orderItems.id });

      if (item.addons.length > 0) {
        await transaction.insert(orderItemAddons).values(item.addons.map((addon) => ({
          orderItemId: insertedItem.id,
          addonId: addon.addonId,
          addonName: addon.addonName,
          addonPrice: addon.addonPrice,
          quantity: addon.quantity,
          imageUrl: addon.imageUrl,
        })));
      }
    }
  });
}

async function createOrderPayment(
  orderId: string,
  customerId: string,
  totalCents: number,
  billingType: CheckoutRequest['billingType'],
  trackingToken: string,
  rateLimitHeaders: Record<string, string>,
) {
  try {
    const checkout = await createCheckout(
      orderId,
      customerId,
      totalCents / 100,
      `Pedido #${orderId.split('-')[0].toUpperCase()} - Rei do Picadão`,
      trackingToken,
      billingType,
    );

    if (!checkout) throw new Error('Checkout unavailable');

    await db.update(orders)
      .set({ asaasCheckoutUrl: checkout.invoiceUrl, paymentId: checkout.paymentId })
      .where(eq(orders.id, orderId));

    return NextResponse.json(
      { checkoutUrl: checkout.invoiceUrl, orderId, trackingToken },
      { headers: rateLimitHeaders },
    );
  } catch {
    await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, orderId));
    throw new CheckoutError(502, 'Não foi possível gerar o pagamento.');
  }
}

async function processCheckout(input: CheckoutRequest, rateLimitHeaders: Record<string, string>) {
  const { items, checkoutData, deliveryQuoteId, billingType } = input;
  const resources = await loadCheckoutResources(items, checkoutData, deliveryQuoteId);

  if (!resources.quote) {
    throw new CheckoutError(409, 'A cotação de frete expirou. Calcule o frete novamente.');
  }

  if (!resources.settings || resources.availableProducts.length !== new Set(items.map((item) => item.productId)).size) {
    throw new CheckoutError(409, 'Um ou mais produtos não estão disponíveis.');
  }

  const { itemsToInsert, subtotalCents } = buildOrderItems(items, resources.availableProducts);
  const minimumOrderCents = toCents(resources.settings.minOrder);
  if (subtotalCents < minimumOrderCents) {
    throw new CheckoutError(422, 'O pedido não atingiu o valor mínimo da loja.');
  }

  const deliveryFeeCents = toCents(resources.quote.deliveryFee);
  const totalCents = subtotalCents + deliveryFeeCents;
  const orderId = crypto.randomUUID();
  const tracking = createTrackingToken();
  const trackingExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const customer = await createAsaasCustomer(
    checkoutData.customerName,
    checkoutData.customerEmail,
    checkoutData.customerPhone,
    checkoutData.customerCpfCnpj,
    checkoutData,
  );

  if (!customer) {
    throw new CheckoutError(502, 'Não foi possível iniciar o pagamento.');
  }

  await insertPendingOrder({
    orderId,
    checkoutData,
    deliveryQuoteId,
    quote: resources.quote,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    trackingHash: tracking.hash,
    trackingExpiresAt,
    items: itemsToInsert,
  });

  return createOrderPayment(orderId, customer.id, totalCents, billingType, tracking.token, rateLimitHeaders);
}

export async function POST(request: Request) {
  const csrfReject = originGuard(request);
  if (csrfReject) return csrfReject;

  const rateLimit = await checkRateLimit('checkout', getRequestIp(request));
  let rateLimitHeaders = createRateLimitHeaders(rateLimit);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.unavailable ? 'Serviço temporariamente indisponível.' : 'Muitas tentativas. Aguarde antes de tentar novamente.' },
      { status: rateLimit.unavailable ? 503 : 429, headers: rateLimitHeaders },
    );
  }

  try {
    const validation = checkoutRequestSchema.safeParse(await request.json());
    if (!validation.success) {
      return NextResponse.json({ error: 'Dados de checkout inválidos.' }, { status: 400, headers: rateLimitHeaders });
    }

    const { checkoutData } = validation.data;
    const identityRateLimit = await checkRateLimit(
      'checkout',
      `identity:${getCheckoutIdentityHash(checkoutData.customerEmail, checkoutData.customerPhone)}`,
    );
    rateLimitHeaders = createRateLimitHeaders(identityRateLimit);
    if (!identityRateLimit.success) {
      return NextResponse.json(
        { error: identityRateLimit.unavailable ? 'Serviço temporariamente indisponível.' : 'Muitas tentativas. Aguarde antes de tentar novamente.' },
        { status: identityRateLimit.unavailable ? 503 : 429, headers: rateLimitHeaders },
      );
    }

    return await processCheckout(validation.data, rateLimitHeaders);
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: rateLimitHeaders });
    }

    console.error('Checkout processing failed', error);
    return NextResponse.json({ error: 'Erro interno ao processar o pedido.' }, { status: 500, headers: rateLimitHeaders });
  }
}
