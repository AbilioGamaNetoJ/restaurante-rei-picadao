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
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SignOutButton } from '@clerk/nextjs';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as any)?.role || 'cliente';

  // Se for apenas um cliente logado tentando acessar o painel, redireciona para a home
  if (!userId || role === 'cliente') {
    redirect('/');
  }

  const menuItems = [
    {
      title: 'Métricas',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['dono'],
    },
    {
      title: 'Fila de Pedidos',
      href: '/pedidos',
      icon: ShoppingBag,
      roles: ['dono', 'gerente', 'funcionario'],
    },
    {
      title: 'Produtos',
      href: '/produtos',
      icon: Package,
      roles: ['dono', 'gerente'],
    },
    {
      title: 'Categorias',
      href: '/categorias',
      icon: Tags,
      roles: ['dono', 'gerente'],
    },
    {
      title: 'Equipe',
      href: '/funcionarios',
      icon: Users,
      roles: ['dono', 'gerente'],
    },
    {
      title: 'Financeiro',
      href: '/financeiro',
      icon: DollarSign,
      roles: ['dono'],
    },
    {
      title: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
      roles: ['dono'],
    },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(role));

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6" />
          <span className="">Rei do Picadão</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {allowedItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <SignOutButton>
          <div>
            <Button variant="outline" className="w-full flex items-center justify-start gap-2">
              <LogOut className="h-4 w-4" />
              Sair do sistema
            </Button>
          </div>
        </SignOutButton>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger render={
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu de navegação</span>
            </Button>
          } />
            <SheetContent side="left" className="flex flex-col p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            <h1 className="text-lg font-semibold">Painel Administrativo</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-slate-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}
