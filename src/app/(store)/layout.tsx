import { ReactNode } from "react";
import Link from "next/link";
import { StoreIcon } from "lucide-react";
import { CartDrawer } from "@/components/store/cart-drawer";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-red-600 text-white p-2 rounded-md">
              <StoreIcon className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-gray-900">
              Rei do Picadão
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
