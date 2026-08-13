import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const TRACKING_TOKEN_BYTES = 32;

export function createTrackingToken() {
  const token = randomBytes(TRACKING_TOKEN_BYTES).toString('base64url');

  return {
    token,
    hash: hashTrackingToken(token),
  };
}

export function hashTrackingToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function isTrackingTokenValid(
  token: string | null,
  expectedHash: string | null,
  expiresAt: Date | null,
) {
  if (!token || !expectedHash || !expiresAt || expiresAt <= new Date()) {
    return false;
  }

  const actualHash = hashTrackingToken(token);
  const actual = Buffer.from(actualHash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
