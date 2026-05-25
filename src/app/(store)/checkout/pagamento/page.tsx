'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreditCard, QrCode } from 'lucide-react';

export default function PagamentoPage() {
  const router = useRouter();
  const { items, checkoutData, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [billingType, setBillingType] = useState<'PIX' | 'CREDIT_CARD'>('PIX');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="container max-w-2xl mx-auto py-10 px-4 text-center">
        <p>Carregando resumo do pedido...</p>
      </div>
    );
  }

  React.useEffect(() => {
    // Aguarda hidratar
    const timer = setTimeout(() => {
      if (useCartStore.persist.hasHydrated() && useCartStore.getState().items.length === 0) {
        if (!redirecting) {
          router.push('/');
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [router, redirecting]);

  if (!checkoutData) {
    return null;
  }

  const subtotal = getTotal();
  const deliveryFee = checkoutData.deliveryFee;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          checkoutData,
          subtotal,
          deliveryFee,
          total,
          billingType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao gerar pagamento.');
        setLoading(false);
        return;
      }

      // Redirecionar para o link de checkout do Asaas
      if (data.checkoutUrl) {
        setRedirecting(true);
        // NOTA: Não limpamos o carrinho aqui. Ele será limpo na página de confirmação.
        // Assim, se o cliente clicar em "voltar" no navegador, o carrinho não se perde.
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Link de pagamento não recebido.');
        setLoading(false);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao processar o pagamento.');
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Resumo do Pedido</h1>

      <div className="bg-muted/50 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Itens</h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-start border-b pb-4 last:border-0 last:pb-0">
              <div className="flex gap-3">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                  />
                )}
                <div>
                  <p className="font-medium">
                    {item.quantity}x {item.name}
                  </p>
                  {item.addons.length > 0 && (
                    <div className="mt-2 ml-4 space-y-2">
                      {item.addons.map((addon) => (
                        <div key={addon.id} className="flex items-center gap-2">
                          {addon.imageUrl && (
                            <img 
                              src={addon.imageUrl} 
                              alt={addon.name} 
                              className="w-8 h-8 rounded object-cover flex-shrink-0" 
                            />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {addon.quantity}x {addon.name} (+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(addon.price * addon.quantity)})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {item.comment && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      Obs: {item.comment}
                    </p>
                  )}
                </div>
              </div>
              <p className="font-medium">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Dados do Cliente</h2>
          <p className="text-sm">{checkoutData.customerName}</p>
          <p className="text-sm">{checkoutData.customerEmail}</p>
          <p className="text-sm">{checkoutData.customerPhone}</p>
        </div>

        <div className="bg-muted/50 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Endereço de Entrega</h2>
          <p className="text-sm">
            {checkoutData.addressStreet}, {checkoutData.addressNumber}
            {checkoutData.addressComplement && ` - ${checkoutData.addressComplement}`}
          </p>
          <p className="text-sm">
            {checkoutData.addressNeighborhood} - {checkoutData.addressCity}/{checkoutData.addressState}
          </p>
          <p className="text-sm">CEP: {checkoutData.addressZip}</p>
        </div>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Forma de Pagamento</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setBillingType('PIX')}
            className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
              billingType === 'PIX'
                ? 'border-primary bg-primary/5'
                : 'border-transparent bg-background hover:border-primary/50'
            }`}
          >
            <QrCode className={`w-8 h-8 mb-2 ${billingType === 'PIX' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`font-semibold ${billingType === 'PIX' ? 'text-primary' : 'text-foreground'}`}>
              Pix
            </span>
          </button>
          
          <button
            onClick={() => setBillingType('CREDIT_CARD')}
            className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
              billingType === 'CREDIT_CARD'
                ? 'border-primary bg-primary/5'
                : 'border-transparent bg-background hover:border-primary/50'
            }`}
          >
            <CreditCard className={`w-8 h-8 mb-2 ${billingType === 'CREDIT_CARD' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`font-semibold ${billingType === 'CREDIT_CARD' ? 'text-primary' : 'text-foreground'}`}>
              Cartão (Crédito/Débito)
            </span>
          </button>
        </div>
      </div>

      <div className="bg-muted/50 p-6 rounded-lg mb-8">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Taxa de Entrega ({checkoutData.distanceKm.toFixed(1)} km)</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4">
            <span>Total a Pagar</span>
            <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()} disabled={loading}>
          Voltar
        </Button>
        <Button onClick={handleCheckout} disabled={loading} size="lg">
          {loading ? 'Gerando Pagamento...' : 'Ir para Pagamento'}
        </Button>
      </div>
    </div>
  );
}
