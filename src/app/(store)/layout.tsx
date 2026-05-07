import { ReactNode } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-red-600">
            Rei do Picadão
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/carrinho" className="flex items-center p-2 rounded-full hover:bg-gray-100 transition">
              <ShoppingCart className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
