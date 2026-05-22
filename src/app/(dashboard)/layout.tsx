import React from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Tags, 
  Users, 
  DollarSign, 
  Settings,
  LogOut,
  Menu,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LogoutButton } from '@/components/logout-button';
import { can, PermissionAction } from '@/lib/permissions';
import { db } from '@/db';
import { users } from '@/db/schema';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  const user = await currentUser();
  const role = (sessionClaims?.metadata as any)?.role || 'cliente';

  // Se for apenas um cliente logado tentando acessar o painel, redireciona para a home
  if (!userId || !can(role, 'access_dashboard')) {
    redirect('/');
  }

  // Sincronizar usuário com o Banco de Dados
  if (user) {
    await db.insert(users).values({
      clerkId: user.id,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      role: role,
    }).onConflictDoUpdate({
      target: users.clerkId,
      set: { 
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: role,
        updatedAt: new Date()
      }
    });
  }

  interface MenuItem {
    title: string;
    href: string;
    icon: any;
    permission: PermissionAction;
  }

  const menuItems: MenuItem[] = [
    {
      title: 'Métricas',
      href: '/dashboard',
      icon: LayoutDashboard,
      permission: 'view_metrics',
    },
    {
      title: 'Fila de Pedidos',
      href: '/pedidos',
      icon: ShoppingBag,
      permission: 'view_orders',
    },
    {
      title: 'Produtos',
      href: '/produtos',
      icon: Package,
      permission: 'manage_products',
    },
    {
      title: 'Categorias',
      href: '/categorias',
      icon: Tags,
      permission: 'manage_categories',
    },
    {
      title: 'Equipe',
      href: '/funcionarios',
      icon: Users,
      permission: 'manage_staff', 
    },
    {
      title: 'Financeiro',
      href: '/financeiro',
      icon: DollarSign,
      permission: 'view_finance',
    },
    {
      title: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      permission: 'edit_settings',
    },
    {
      title: 'Meu Perfil',
      href: '/perfil',
      icon: User,
      permission: 'access_dashboard',
    },
  ];

  const allowedItems = menuItems.filter(item => can(role, item.permission));

  // Buscar configurações da loja para o logo
  const settings = await db.query.storeSettings.findFirst();
  const logoUrl = settings?.logoUrl;
  const storeName = settings?.name || "Rei do Picadão";

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] bg-slate-50">
      <div className="hidden border-r border-slate-200 bg-white md:block relative z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
        <SidebarContent allowedItems={allowedItems} logoUrl={logoUrl} storeName={storeName} />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10 transition-all">
          <Sheet>
            <SheetTrigger nativeButton={true} render={
              <button
                className="shrink-0 md:hidden inline-flex items-center justify-center rounded-md border border-slate-200 bg-white h-9 w-9 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu de navegação</span>
              </button>
            } />
            <SheetContent side="left" className="flex flex-col p-0 w-72 border-r-0">
              <SidebarContent allowedItems={allowedItems} logoUrl={logoUrl} storeName={storeName} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Painel Administrativo</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ allowedItems, logoUrl, storeName }: { allowedItems: any[], logoUrl?: string | null, storeName: string }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-14 md:h-[60px] items-center border-b border-slate-100 px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-3 font-bold group w-full">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={storeName} 
              className="h-8 w-8 object-cover rounded-md border border-slate-100 bg-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md" 
            />
          ) : (
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-1.5 rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Package className="h-[18px] w-[18px]" />
            </div>
          )}
          <span className="truncate tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">{storeName}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-6">
        <nav className="grid items-start px-3 text-sm font-medium gap-1.5 lg:px-4">
          <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu Principal
          </div>
          {allowedItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-500 transition-all duration-200 hover:bg-blue-50/60 hover:text-blue-700"
            >
              <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:text-blue-600" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50">
        <LogoutButton />
      </div>
    </div>
  );
}
