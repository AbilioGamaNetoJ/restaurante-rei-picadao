import { test, expect } from '@playwright/test';

test.describe('Public Store — Security', () => {
  test('homepage loads and has security headers', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    const headers = response?.headers() ?? {};
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['content-security-policy']).toBeTruthy();
  });

  test('CSP does not contain broad unsafe-inline for scripts', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'] ?? '';
    const scriptSrc = csp.match(/script-src[^;]*/i)?.[0] ?? '';
    expect(scriptSrc).toContain("strict-dynamic");
    expect(scriptSrc).not.toMatch(/'unsafe-inline'(?!.*nonce)/);
  });

  test('public product API does not leak costPrice', async ({ request }) => {
    const response = await request.get('/api/produtos?isAvailable=true');
    expect(response.ok()).toBeTruthy();

    const products = await response.json();
    expect(Array.isArray(products)).toBe(true);

    if (products.length > 0) {
      const product = products[0];
      expect(product).not.toHaveProperty('costPrice');
    }
  });

  test('dashboard redirects unauthenticated user', async ({ page }) => {
    const response = await page.goto('/dashboard');
    expect(response?.url()).not.toMatch(/\/dashboard$/);
  });

  test('checkout API rejects cross-origin (CSRF)', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      headers: { 'content-type': 'application/json', origin: 'https://evil.com' },
      data: { items: [], checkoutData: {}, deliveryQuoteId: 'fake', billingType: 'PIX' },
    });
    expect(response.status()).toBe(403);
  });

  test('frete API rejects cross-origin (CSRF)', async ({ request }) => {
    const response = await request.post('/api/frete', {
      headers: { 'content-type': 'application/json', origin: 'https://evil.com' },
      data: {},
    });
    expect(response.status()).toBe(403);
  });

  test('checkout API rejects tampered payload with injected price', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      headers: { 'content-type': 'application/json' },
      data: {
        items: [{ productId: 'fake', quantity: 1, addons: [], price: 0.01 }],
        checkoutData: {},
        deliveryQuoteId: 'fake',
        billingType: 'PIX',
      },
    });
    expect(response.status()).toBe(400);
  });
});
