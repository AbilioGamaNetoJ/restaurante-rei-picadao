import { NextResponse } from 'next/server';
import { and, eq, gt, inArray, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { deliveryQuotes, orderItemAddons, orderItems, orders, products } from '@/db/schema';
import { checkoutRequestSchema, formatCents, getAddressHash, getCheckoutIdentityHash, toCents } from '@/lib/checkout';
import { createAsaasCustomer, createCheckout } from '@/lib/asaas';
import { createTrackingToken } from '@/lib/order-tracking';
import { checkRateLimit, createRateLimitHeaders, getRequestIp } from '@/lib/rate-limit';
import { originGuard } from '@/lib/origin-guard';

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

    const { items, checkoutData, deliveryQuoteId, billingType } = validation.data;
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

    if (!quote) {
      return NextResponse.json({ error: 'A cotação de frete expirou. Calcule o frete novamente.' }, { status: 409, headers: rateLimitHeaders });
    }

    if (!settings || availableProducts.length !== productIds.length) {
      return NextResponse.json({ error: 'Um ou mais produtos não estão disponíveis.' }, { status: 409, headers: rateLimitHeaders });
    }

    const productById = new Map(availableProducts.map((product) => [product.id, product]));
    const itemsToInsert: Array<{
      productId: string;
      productName: string;
      productPrice: string;
      quantity: number;
      comment?: string;
      subtotal: string;
      addons: Array<{ addonId: string; addonName: string; addonPrice: string; quantity: number; imageUrl: string | null }>;
    }> = [];
    let subtotalCents = 0;

    for (const requestedItem of items) {
      const product = productById.get(requestedItem.productId);
      if (!product) {
        return NextResponse.json({ error: 'Produto indisponível.' }, { status: 409, headers: rateLimitHeaders });
      }

      const addonsById = new Map(
        product.addons
          .map((relation) => relation.addon)
          .filter((addon) => addon?.isAvailable)
          .map((addon) => [addon.id, addon]),
      );
      const seenAddonIds = new Set<string>();
      const addonsToInsert: Array<{ addonId: string; addonName: string; addonPrice: string; quantity: number; imageUrl: string | null }> = [];
      let addonsCents = 0;

      for (const requestedAddon of requestedItem.addons) {
        if (seenAddonIds.has(requestedAddon.id)) {
          return NextResponse.json({ error: 'Adicional duplicado no pedido.' }, { status: 400, headers: rateLimitHeaders });
        }

        const addon = addonsById.get(requestedAddon.id);
        if (!addon) {
          return NextResponse.json({ error: 'Adicional inválido ou indisponível.' }, { status: 409, headers: rateLimitHeaders });
        }

        seenAddonIds.add(addon.id);
        const addonPriceCents = toCents(addon.price);
        addonsCents += addonPriceCents * requestedAddon.quantity;
        addonsToInsert.push({
          addonId: addon.id,
          addonName: addon.name,
          addonPrice: formatCents(addonPriceCents),
          quantity: requestedAddon.quantity,
          imageUrl: addon.imageUrl,
        });
      }

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
        addons: addonsToInsert,
      });
    }

    const minimumOrderCents = toCents(settings.minOrder);
    if (subtotalCents < minimumOrderCents) {
      return NextResponse.json({ error: 'O pedido não atingiu o valor mínimo da loja.' }, { status: 422, headers: rateLimitHeaders });
    }

    const deliveryFeeCents = toCents(quote.deliveryFee);
    const totalCents = subtotalCents + deliveryFeeCents;
    const orderId = crypto.randomUUID();
    const tracking = createTrackingToken();
    const trackingExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const customer = await createAsaasCustomer(
      checkoutData.customerName,
      checkoutData.customerEmail,
      checkoutData.customerPhone,
      checkoutData.customerCpfCnpj,
      {
        addressZip: checkoutData.addressZip,
        addressStreet: checkoutData.addressStreet,
        addressNumber: checkoutData.addressNumber,
        addressComplement: checkoutData.addressComplement,
        addressNeighborhood: checkoutData.addressNeighborhood,
      },
    );

    if (!customer) {
      return NextResponse.json({ error: 'Não foi possível iniciar o pagamento.' }, { status: 502, headers: rateLimitHeaders });
    }

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
        trackingTokenHash: tracking.hash,
        trackingTokenExpiresAt: trackingExpiresAt,
      });

      for (const item of itemsToInsert) {
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

    try {
      const checkout = await createCheckout(
        orderId,
        customer.id,
        totalCents / 100,
        `Pedido #${orderId.split('-')[0].toUpperCase()} - Rei do Picadão`,
        tracking.token,
        billingType,
      );

      if (!checkout) throw new Error('Checkout unavailable');

      await db.update(orders)
        .set({ asaasCheckoutUrl: checkout.invoiceUrl, paymentId: checkout.paymentId })
        .where(eq(orders.id, orderId));

      return NextResponse.json(
        { checkoutUrl: checkout.invoiceUrl, orderId, trackingToken: tracking.token },
        { headers: rateLimitHeaders },
      );
    } catch {
      await db.update(orders).set({ status: 'cancelled' }).where(eq(orders.id, orderId));
      return NextResponse.json({ error: 'Não foi possível gerar o pagamento.' }, { status: 502, headers: rateLimitHeaders });
    }
  } catch (error) {
    console.error('Checkout processing failed', error);
    return NextResponse.json({ error: 'Erro interno ao processar o pedido.' }, { status: 500, headers: rateLimitHeaders });
  }
}
