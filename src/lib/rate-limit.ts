import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type RateLimitScope = 'checkout' | 'freight' | 'orderStatus' | 'pixQrCode' | 'pushSubscription' | 'upload';

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  unavailable?: boolean;
};

const RATE_LIMITS: Record<RateLimitScope, { limit: number; window: `${number} ${'s' | 'm'}` }> = {
  checkout: { limit: 3, window: '15 m' },
  freight: { limit: 20, window: '15 m' },
  orderStatus: { limit: 30, window: '1 m' },
  pixQrCode: { limit: 30, window: '1 m' },
  pushSubscription: { limit: 10, window: '15 m' },
  upload: { limit: 10, window: '15 m' },
};

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? Redis.fromEnv()
  : null;

const distributedLimiters = redis
  ? Object.fromEntries(
      Object.entries(RATE_LIMITS).map(([scope, config]) => [
        scope,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(config.limit, config.window),
          prefix: `rei-picadao:${scope}`,
        }),
      ]),
    ) as Record<RateLimitScope, Ratelimit>
  : null;

const developmentWindows = new Map<string, { count: number; reset: number }>();

export function getRequestIp(request: Request) {
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp;

  const isProduction = process.env.NODE_ENV === 'production';

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor && !isProduction) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function checkRateLimit(scope: RateLimitScope, identifier: string): Promise<RateLimitResult> {
  if (distributedLimiters) {
    return distributedLimiters[scope].limit(identifier);
  }

  if (process.env.NODE_ENV === 'production') {
    return { success: false, limit: 0, remaining: 0, reset: Date.now(), unavailable: true };
  }

  return checkDevelopmentRateLimit(scope, identifier);
}

export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
    ...(result.success ? {} : { 'Retry-After': String(Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))) }),
  };
}

function checkDevelopmentRateLimit(scope: RateLimitScope, identifier: string): RateLimitResult {
  const config = RATE_LIMITS[scope];
  const key = `${scope}:${identifier}`;
  const now = Date.now();
  const duration = parseWindow(config.window);
  const current = developmentWindows.get(key);

  if (!current || current.reset <= now) {
    const reset = now + duration;
    developmentWindows.set(key, { count: 1, reset });
    return { success: true, limit: config.limit, remaining: config.limit - 1, reset };
  }

  current.count += 1;
  return {
    success: current.count <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - current.count),
    reset: current.reset,
  };
}

function parseWindow(window: `${number} ${'s' | 'm'}`) {
  const [amount, unit] = window.split(' ');
  const multiplier = unit === 'm' ? 60_000 : 1_000;

  return Number(amount) * multiplier;
}
