import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/pedidos(.*)']);
const isOwnerRoute = createRouteMatcher([
  '/dashboard/dashboard(.*)',
  '/dashboard/financeiro(.*)',
  '/dashboard/configuracoes(.*)',
]);
const isManagerRoute = createRouteMatcher([
  '/dashboard/produtos(.*)',
  '/dashboard/categorias(.*)',
  '/dashboard/funcionarios(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    await auth.protect();
    
    const sessionClaims = await auth();
    const role = sessionClaims?.sessionClaims?.metadata?.role as string | undefined;

    // Bloqueio Global: Se não tiver role definida ou for apenas cliente, não entra no painel
    if (!role || role === 'cliente') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Se tentar acessar rota de dono e não for dono
    if (isOwnerRoute(req) && role !== 'dono') {
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
