import { ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/db";
import { StoreIcon } from "@/components/store/store-icons";
import { CartDrawer } from "@/components/store/cart-drawer";
import { auth } from "@clerk/nextjs/server";
import { can } from "@/lib/permissions";
import { LayoutDashboard } from "lucide-react";

export default async function StoreLayout({ children }: Readonly<{ children: ReactNode }>) {
  await connection();

  const settings = await db.query.storeSettings.findFirst();
  const storeName = settings?.name || "Rei do Picadão";
  const logoUrl = settings?.logoUrl;
  
  const { sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role as string | undefined;
  const showDashboardLink = can(userRole, 'access_dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={storeName} 
                className="h-10 w-10 object-cover rounded-full border bg-white group-hover:scale-105 transition-all duration-300 shadow-sm" 
              />
            ) : (
              <div className="bg-red-600 text-white p-2 rounded-full group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-red-200">
                <StoreIcon className="h-5 w-5" />
              </div>
            )}
            <span className="font-semibold text-xl text-gray-900 group-hover:text-red-600 transition-colors">
              {storeName}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {showDashboardLink && (
              <Link 
                href="/dashboard" 
                className="relative inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                title="Acessar Dashboard"
              >
                <LayoutDashboard className="h-5 w-5" />
              </Link>
            )}
            <CartDrawer />
          </div>
        </div>
      </header>
      <main className="flex-1 py-8">
        {children}
      </main>
    </div>
  );
}
