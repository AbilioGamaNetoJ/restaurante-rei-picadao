import Link from "next/link";
import { StoreIcon } from "@/components/store/store-icons";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-red-600 text-white p-2 rounded-full group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-red-200">
              <StoreIcon className="h-5 w-5" />
            </div>
            <span className="font-black text-xl text-gray-900 tracking-tighter group-hover:text-red-600 transition-colors">
              Rei do Picadão
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="flex flex-col items-center text-center max-w-lg">
          <div className="relative mb-8">
            <span className="text-[12rem] md:text-[16rem] font-black text-gray-100 select-none leading-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-2xl rounded-full p-5 md:p-7 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100">
                <StoreIcon className="h-10 w-10 md:h-14 md:w-14 text-red-600" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter mb-3">
            Página não encontrada
          </h1>

          <p className="text-gray-500 font-medium text-sm md:text-base leading-relaxed mb-10 max-w-sm">
            O link que você procurou não existe ou foi removido. 
            Que tal voltar para o início e conferir nosso cardápio?
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-red-600 text-white font-bold text-sm px-8 py-3.5 rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-xl hover:shadow-red-300 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98]"
          >
            <StoreIcon className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>
      </main>
    </div>
  );
}
