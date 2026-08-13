const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const allowedOrigins = (() => {
  try {
    const url = new URL(APP_URL);
    const roots = new Set([url.origin]);

    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
    if (vercelUrl) {
      roots.add(`https://${vercelUrl}`);
    }

    if (process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL) {
      roots.add(`https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`);
    }

    return roots;
  } catch {
    return new Set([APP_URL]);
  }
})();

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  if (origin) {
    return allowedOrigins.has(origin);
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return allowedOrigins.has(refererUrl.origin);
    } catch {
      return false;
    }
  }

  return false;
}

export function originGuard(request: Request): Response | null {
  if (!isAllowedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Origem não permitida.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}
