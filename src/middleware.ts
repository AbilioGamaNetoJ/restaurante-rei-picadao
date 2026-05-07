import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isDashboardRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/pedidos(.*)',
  '/produtos(.*)',
  '/categorias(.*)',
  '/funcionarios(.*)',
  '/financeiro(.*)',
  '/configuracoes(.*)',
]);

const isOwnerOnlyRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/financeiro(.*)',
  '/configuracoes(.*)',
]);

const isManagerRoute = createRouteMatcher([
  '/produtos(.*)',
  '/categorias(.*)',
  '/funcionarios(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    await auth.protect();
    
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as any)?.role as string | undefined;

    // Bloqueio Global: Se não tiver role definida ou for apenas cliente, não entra no painel
    if (!role || role === 'cliente') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Se tentar acessar rota exclusiva de dono e não for dono
    if (isOwnerOnlyRoute(req) && role !== 'dono') {
      return NextResponse.redirect(new URL('/pedidos', req.url));
    }

    // Se tentar acessar rota de gerente e for apenas funcionário
    if (isManagerRoute(req) && role !== 'dono' && role !== 'gerente') {
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
