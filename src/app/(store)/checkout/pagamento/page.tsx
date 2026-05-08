'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PagamentoPage() {
  const router = useRouter();
  const { items, checkoutData, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = React.useState(false);

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

  if (items.length === 0 || !checkoutData) {
    router.push('/carrinho');
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Erro ao gerar pagamento.');
        setLoading(false);
        return;
      }

      // Limpar o carrinho (opcional, pode ser feito apenas após a confirmação via webhook,
      // mas como o usuário está indo pro checkout externo, vamos limpar agora para evitar que
      // ele volte e faça pedido duplicado. Ou melhor, limpar na página de confirmação).
      
      // Redirecionar para o link de checkout do Asaas
      if (data.checkoutUrl) {
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
              <div>
                <p className="font-medium">
                  {item.quantity}x {item.name}
                </p>
                {item.addons.length > 0 && (
                  <ul className="text-sm text-muted-foreground mt-1 ml-4 list-disc">
                    {item.addons.map((addon) => (
                      <li key={addon.id}>
                        {addon.quantity}x {addon.name} (+ {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(addon.price * addon.quantity)})
                      </li>
                    ))}
                  </ul>
                )}
                {item.comment && (
                  <p className="text-sm text-muted-foreground mt-1 italic">
                    Obs: {item.comment}
                  </p>
                )}
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
