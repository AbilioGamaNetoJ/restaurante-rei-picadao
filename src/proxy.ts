import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { can, getRoleFromClaims, PermissionAction } from './lib/permissions';

const isDashboardRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/pedidos(.*)',
  '/produtos(.*)',
  '/categorias(.*)',
  '/funcionarios(.*)',
  '/financeiro(.*)',
  '/configuracoes(.*)',
]);

// Map routes to required permissions
const ROUTE_PERMISSIONS: Record<string, PermissionAction> = {
  '/dashboard': 'view_metrics',
  '/financeiro': 'view_finance',
  '/configuracoes': 'edit_settings',
  '/produtos': 'manage_products',
  '/categorias': 'manage_categories',
  '/funcionarios': 'manage_staff',
  '/pedidos': 'view_orders',
};

function buildContentSecurityPolicy(nonce: string) {
  const developmentScriptPolicy = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : '';

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://*.asaas.com",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScriptPolicy}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.clerk.com https://utfs.io https://ufs.sh https://2kxxldfafv.ufs.sh",
    "font-src 'self' data:",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.uploadthing.com https://*.ufs.sh https://*.utfs.io",
    "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

function withContentSecurityPolicy(response: NextResponse, contentSecurityPolicy: string) {
  response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  return response;
}

export const proxy = clerkMiddleware(async (auth, req) => {
  const nonce = crypto.randomUUID();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicy);
  requestHeaders.set('x-nonce', nonce);
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isDashboardRoute(req)) {
    await auth.protect();
    
    const { sessionClaims } = await auth();
    const role = getRoleFromClaims(sessionClaims);

    // Bloqueio Global: Se não tiver role definida ou não puder acessar dashboard
    if (!role || !can(role, 'access_dashboard')) {
      return withContentSecurityPolicy(NextResponse.redirect(new URL('/', req.url)), contentSecurityPolicy);
    }

    // Verificar permissão específica para a rota
    const pathname = req.nextUrl.pathname;
    const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([route]) => 
      pathname.startsWith(route)
    )?.[1];

    if (requiredPermission && !can(role, requiredPermission)) {
      // Redireciona para pedidos se não tiver permissão para a rota específica
      return withContentSecurityPolicy(NextResponse.redirect(new URL('/pedidos', req.url)), contentSecurityPolicy);
    }
  }

  return withContentSecurityPolicy(response, contentSecurityPolicy);
});


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    // The matcher must remain a literal so Next.js can statically validate the segment configuration.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
