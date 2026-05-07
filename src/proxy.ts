import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { can, PermissionAction } from './lib/permissions';

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

export const proxy = clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    await auth.protect();
    
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role as string | undefined;

    // Bloqueio Global: Se não tiver role definida ou não puder acessar dashboard
    if (!role || !can(role, 'access_dashboard')) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Verificar permissão específica para a rota
    const pathname = req.nextUrl.pathname;
    const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(([route]) => 
      pathname.startsWith(route)
    )?.[1];

    if (requiredPermission && !can(role, requiredPermission)) {
      // Redireciona para pedidos se não tiver permissão para a rota específica
      return NextResponse.redirect(new URL('/pedidos', req.url));
    }
  }
});


export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
