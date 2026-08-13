import { describe, it, expect } from 'vitest';

// We test the origin-guard with controlled env vars
// Need to set NEXT_PUBLIC_APP_URL before importing
process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

const { isAllowedOrigin } = await import('./origin-guard');

function makeRequest(headers: Record<string, string>): Request {
  return new Request('https://api.example.com/test', { headers });
}

describe('Origin Guard (CSRF Protection)', () => {
  it('accepts request with matching Origin', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'https://example.com' }))).toBe(true);
  });

  it('rejects request with mismatched Origin', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'https://evil.com' }))).toBe(false);
  });

  it('rejects request with no Origin or Referer', () => {
    expect(isAllowedOrigin(makeRequest({}))).toBe(false);
  });

  it('accepts request with matching Referer origin', () => {
    const req = makeRequest({ referer: 'https://example.com/some-page' });
    expect(isAllowedOrigin(req)).toBe(true);
  });

  it('rejects request with mismatched Referer', () => {
    const req = makeRequest({ referer: 'https://evil.com/page' });
    expect(isAllowedOrigin(req)).toBe(false);
  });

  it('rejects Origin that is a substring match (prefix attack)', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'https://example.com.evil.com' }))).toBe(false);
  });

  it('rejects Origin from different port', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'https://example.com:8080' }))).toBe(false);
  });

  it('rejects Origin from different protocol', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'http://example.com' }))).toBe(false);
  });

  it('prefers Origin over Referer when both present', () => {
    const req = makeRequest({
      origin: 'https://evil.com',
      referer: 'https://example.com/page',
    });
    expect(isAllowedOrigin(req)).toBe(false);
  });

  it('handles malformed Referer gracefully', () => {
    const req = makeRequest({ referer: 'not-a-url' });
    expect(isAllowedOrigin(req)).toBe(false);
  });
});
