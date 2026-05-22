"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  ChevronLeft, 
  ChevronRight, 
  Package, 
  X,
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  Users, 
  DollarSign, 
  Settings,
  User 
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { LogoutButton } from '@/components/logout-button';
import { cn } from '@/lib/utils';
import { can, PermissionAction } from '@/lib/permissions';

export interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
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

export function DashboardLayoutClient({
  children,
  role,
  logoUrl,
  storeName,
}: {
  children: React.ReactNode;
  role: string;
  logoUrl?: string | null;
  storeName: string;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('dashboard_sidebar_collapsed');
    if (stored !== null) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  const allowedItems = menuItems.filter(item => can(role, item.permission));

  // Fecha o menu mobile quando a rota muda
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className={cn(
      "grid min-h-screen w-full transition-all duration-300 bg-slate-50",
      isCollapsed ? "md:grid-cols-[80px_1fr]" : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
    )}>
      {/* Desktop Sidebar */}
      <div className="hidden border-r border-slate-200 bg-white md:flex flex-col relative z-20 shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-all duration-300">
        <SidebarContent 
          allowedItems={allowedItems} 
          logoUrl={logoUrl} 
          storeName={storeName} 
          isCollapsed={isCollapsed} 
          pathname={pathname}
        />
        
        {/* Toggle Collapse Button */}
        <button
          onClick={() => {
            const newVal = !isCollapsed;
            setIsCollapsed(newVal);
            localStorage.setItem('dashboard_sidebar_collapsed', String(newVal));
          }}
          className="absolute -right-3 top-16 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-colors z-30"
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex flex-col min-h-screen w-full relative">
        {/* Header - Desktop & Mobile */}
        <header className="flex h-14 items-center gap-4 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 lg:h-[60px] lg:px-6 sticky top-0 z-10 transition-all">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger nativeButton={true} render={
              <button
                className="shrink-0 md:hidden inline-flex items-center justify-center rounded-md border border-slate-200 bg-white h-9 w-9 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu de navegação</span>
              </button>
            } />
            <SheetContent side="left" className="flex flex-col p-0 w-72 border-r-0" showCloseButton={false}>
              <div className="absolute right-4 top-4 z-50">
                <SheetClose nativeButton={true} render={
                  <button className="rounded-md p-2 bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar</span>
                  </button>
                } />
              </div>
              <SidebarContent 
                allowedItems={allowedItems} 
                logoUrl={logoUrl} 
                storeName={storeName} 
                isCollapsed={false}
                pathname={pathname}
              />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Painel Administrativo</h1>
          </div>
        </header>

        {/* Floating Side Button for Mobile Navigation (Botão Lateral) */}
        <div className="md:hidden fixed left-0 top-1/2 -translate-y-1/2 z-40">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="flex items-center justify-center h-12 w-8 bg-blue-600 text-white rounded-r-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 border border-l-0 border-blue-500"
            aria-label="Abrir menu de navegação"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50/50 w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ 
  allowedItems, 
  logoUrl, 
  storeName, 
  isCollapsed,
  pathname
}: { 
  allowedItems: MenuItem[], 
  logoUrl?: string | null, 
  storeName: string, 
  isCollapsed: boolean,
  pathname: string
}) {
  return (
    <div className="flex h-full flex-col bg-white overflow-hidden">
      <div className={cn(
        "flex h-14 md:h-[60px] items-center border-b border-slate-100 transition-all px-4",
        isCollapsed ? "justify-center px-2" : "lg:px-6"
      )}>
        <Link href="/" className={cn("flex items-center gap-3 font-bold group w-full", isCollapsed && "justify-center")}>
          {logoUrl ? (
            <Image 
              src={logoUrl} 
              alt={storeName} 
              width={32}
              height={32}
              className={cn(
                "object-cover rounded-md border border-slate-100 bg-white shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md",
                isCollapsed ? "h-8 w-8" : "h-8 w-8"
              )} 
            />
          ) : (
            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-1.5 rounded-lg shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0">
              <Package className="h-[18px] w-[18px]" />
            </div>
          )}
          {!isCollapsed && (
            <span className="truncate tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
              {storeName}
            </span>
          )}
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 scrollbar-thin scrollbar-thumb-slate-200">
        <nav className="grid items-start px-3 text-sm font-medium gap-1.5 lg:px-4">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Menu Principal
            </div>
          )}
          {allowedItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md transition-all duration-200",
                  isCollapsed ? "justify-center py-3" : "gap-3 px-3 py-2.5",
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-semibold" 
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className={cn(
                  "shrink-0 transition-transform duration-200",
                  isCollapsed ? "h-5 w-5" : "h-4 w-4",
                  isActive ? "text-blue-600" : "group-hover:scale-110 group-hover:text-blue-600"
                )} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className={cn(
        "mt-auto p-4 border-t border-slate-100 bg-slate-50/50 transition-all",
        isCollapsed ? "flex justify-center px-2" : ""
      )}>
        <LogoutButton isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}
