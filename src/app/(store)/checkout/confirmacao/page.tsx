'use client';

import * as React from 'react';


import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

function ConfirmacaoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    // Ao chegar na tela de confirmação, limpa o carrinho
    clearCart();
  }, [clearCart]);

  if (!orderId) {
    return (
      <div className="container max-w-2xl mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
        <p className="text-muted-foreground mb-8">
          Não conseguimos identificar o número do seu pedido.
        </p>
        <Button render={<Link href="/" />} nativeButton={false}>
          Voltar ao início
        </Button>
      </div>
    );
  }

  // Format order short ID (e.g., first segment of UUID)
  const shortId = orderId.split('-')[0].toUpperCase();

  return (
    <div className="container max-w-2xl mx-auto py-20 px-4 text-center">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-4">Pedido Confirmado!</h1>
      <p className="text-lg mb-2">
        Agradecemos pela preferência.
      </p>
      <div className="bg-muted p-4 rounded-lg my-6 inline-block">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
          Número do Pedido
        </p>
        <p className="text-2xl font-bold font-mono">#{shortId}</p>
      </div>
      <p className="text-muted-foreground mb-10 max-w-md mx-auto">
        Assim que o pagamento for processado pelo nosso sistema, começaremos o preparo do seu pedido. Você pode acompanhar o status caso tenhamos o seu contato via WhatsApp.
      </p>
      
      <Button render={<Link href="/" />} size="lg" nativeButton={false}>
        Voltar ao Cardápio
      </Button>
    </div>
  );
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-2xl mx-auto py-20 px-4 text-center">
        <p>Carregando confirmação...</p>
      </div>
    }>
      <ConfirmacaoContent />
    </Suspense>
  );
}
