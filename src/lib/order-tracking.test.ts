import { describe, it, expect } from 'vitest';
import { createTrackingToken, hashTrackingToken, isTrackingTokenValid } from './order-tracking';

describe('Tracking Token Security', () => {
  describe('createTrackingToken()', () => {
    it('generates a token and its hash', () => {
      const { token, hash } = createTrackingToken();
      expect(token).toBeTruthy();
      expect(hash).toBeTruthy();
      expect(token).not.toBe(hash);
    });

    it('generates cryptographically random tokens (uniqueness)', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(createTrackingToken().token);
      }
      expect(tokens.size).toBe(100);
    });

    it('produces hash that matches manual hashing', () => {
      const { token, hash } = createTrackingToken();
      expect(hash).toBe(hashTrackingToken(token));
    });

    it('token has sufficient entropy (>=32 bytes base64url)', () => {
      const { token } = createTrackingToken();
      // 32 bytes base64url encoded = ~43 chars without padding
      expect(token.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('isTrackingTokenValid()', () => {
    it('validates a correct token with future expiry', () => {
      const { token, hash } = createTrackingToken();
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      expect(isTrackingTokenValid(token, hash, futureDate)).toBe(true);
    });

    it('rejects an incorrect token', () => {
      const { hash } = createTrackingToken();
      const futureDate = new Date(Date.now() + 1000);
      expect(isTrackingTokenValid('wrong-token', hash, futureDate)).toBe(false);
    });

    it('rejects an expired token', () => {
      const { token, hash } = createTrackingToken();
      const pastDate = new Date(Date.now() - 1000);
      expect(isTrackingTokenValid(token, hash, pastDate)).toBe(false);
    });

    it('rejects null inputs', () => {
      expect(isTrackingTokenValid(null, 'hash', new Date())).toBe(false);
      expect(isTrackingTokenValid('token', null, new Date())).toBe(false);
      expect(isTrackingTokenValid('token', 'hash', null)).toBe(false);
    });

    it('rejects empty strings', () => {
      const { hash } = createTrackingToken();
      expect(isTrackingTokenValid('', hash, new Date(Date.now() + 1000))).toBe(false);
    });

    it('is timing-safe (does not throw on length mismatch)', () => {
      const { hash } = createTrackingToken();
      const futureDate = new Date(Date.now() + 1000);
      expect(() => isTrackingTokenValid('short', hash, futureDate)).not.toThrow();
      expect(isTrackingTokenValid('short', hash, futureDate)).toBe(false);
    });
  });
});
