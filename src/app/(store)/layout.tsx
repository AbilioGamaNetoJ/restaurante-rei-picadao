import { ReactNode } from "react";
import Link from "next/link";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { StoreIcon } from "@/components/store/store-icons";
import { CartDrawer } from "@/components/store/cart-drawer";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const settings = await db.query.storeSettings.findFirst();
  const storeName = settings?.name || "Rei do Picadão";
  const logoUrl = settings?.logoUrl;

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
            <span className="font-black text-xl text-gray-900 tracking-tighter group-hover:text-red-600 transition-colors">
              {storeName}
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <CartDrawer />
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
