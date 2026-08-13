'use client';

import * as React from 'react';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, CreditCard, ChefHat, PackageCheck, Bike, CheckCircle2, XCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import { confirmOrderDelivery } from './actions';
import { toast } from 'sonner';

type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

const statusConfig: Record<OrderStatus, { label: string; icon: React.ElementType; step: number }> = {
  pending: { label: 'Aguardando Pagamento', icon: Clock, step: 1 },
  paid: { label: 'Pagamento Confirmado', icon: CreditCard, step: 2 },
  preparing: { label: 'Em Preparo', icon: ChefHat, step: 3 },
  ready: { label: 'Pronto para Entrega', icon: PackageCheck, step: 4 },
  delivering: { label: 'Saiu para Entrega', icon: Bike, step: 5 },
  delivered: { label: 'Pedido Entregue', icon: CheckCircle2, step: 6 },
  cancelled: { label: 'Pedido Cancelado', icon: XCircle, step: 0 },
};

function ConfirmacaoContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const trackingToken = searchParams.get('token');
  const clearCart = useCartStore((state) => state.clearCart);
  
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [loading, setLoading] = useState(() => Boolean(orderId && trackingToken));
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ encodedImage: string, payload: string } | null>(null);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    // Ao chegar na tela de confirmação, limpa o carrinho
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderId || !trackingToken) {
      return;
    }

    const fetchStatus = async () => {
      try {
        // Use the check-status endpoint which queries Asaas directly as fallback
        const params = new URLSearchParams({ orderId, token: trackingToken });
        const res = await fetch(`/api/orders/check-status?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) {
            setStatus(data.status as OrderStatus);
            
            // Se ainda estiver aguardando pagamento, busca o QR Code PIX (se existir)
            if (data.status === 'pending') {
               fetch(`/api/orders/pix-qrcode?${params.toString()}`)
                 .then(r => r.json())
                 .then(d => {
                    if (d.qrCode) setQrCodeData(d.qrCode);
                 })
                 .catch(err => console.error('Erro ao buscar QR Code:', err));
            }
          }
        }
      } catch (error) {
        console.error('Error fetching order status:', error);
      }
      setLoading(false);
    };

    fetchStatus();

    // Poll every 5 seconds — endpoint checks Asaas API if status is still pending
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId, trackingToken]);

  const handleConfirmDelivery = async () => {
    if (!orderId || !trackingToken) return;
    
    setConfirmingDelivery(true);
    const result = await confirmOrderDelivery(orderId, trackingToken);
    if (result.success) {
      setStatus('delivered');
      toast.success('Que ótimo! Agradecemos a preferência.');
    } else {
      toast.error('Não foi possível confirmar a entrega.');
    }
    setConfirmingDelivery(false);
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-20 px-4 text-center">
        <p>Carregando dados do pedido...</p>
      </div>
    );
  }

  if (!orderId || !trackingToken) {
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
  const currentStep = statusConfig[status]?.step || 0;
  const isCancelled = status === 'cancelled';

  let statusIcon: React.ReactNode;
  if (isCancelled) {
    statusIcon = <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />;
  } else if (currentStep === 6) {
    statusIcon = <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />;
  } else {
    statusIcon = <Clock className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />;
  }

  return (
    <div className="container max-w-2xl mx-auto py-10 px-4">
      <div className="text-center mb-10">
        {statusIcon}

        <h1 className="text-3xl font-bold mb-2">
          {isCancelled ? 'Pedido Cancelado' : 'Acompanhe seu Pedido'}
        </h1>
        
        <div className="bg-muted px-4 py-2 rounded-lg inline-block mt-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Número do Pedido
          </p>
          <p className="text-xl font-bold font-mono">#{shortId}</p>
        </div>
      </div>

      {status === 'pending' && qrCodeData && (
        <div className="bg-card border border-primary/20 rounded-xl p-6 mb-8 shadow-sm text-center">
          <h2 className="font-semibold text-xl mb-2">Pague com PIX</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Escaneie o QR Code abaixo ou copie a chave Pix para finalizar seu pedido.
          </p>
          
          <div className="flex justify-center mb-6">
            <div className="bg-white p-2 border rounded-xl shadow-sm">
              <img 
                src={`data:image/jpeg;base64,${qrCodeData.encodedImage}`} 
                alt="QR Code PIX" 
                className="w-48 h-48"
              />
            </div>
          </div>
          
          <div className="bg-muted p-3 rounded-lg flex items-center justify-between gap-3 max-w-sm mx-auto border">
            <p className="text-xs truncate font-mono text-muted-foreground text-left w-full">
              {qrCodeData.payload}
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(qrCodeData.payload);
                setCopying(true);
                toast.success('Chave Pix copiada!');
                setTimeout(() => setCopying(false), 2000);
              }}
            >
              {copying ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {!isCancelled && (
        <div className="bg-card border rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="font-semibold text-lg mb-6">Status do Preparo</h2>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
            {Object.entries(statusConfig).filter(([k]) => k !== 'cancelled').map(([key, config]) => {
              const stepNumber = config.step;
              const Icon = config.icon;
              
              const isCompleted = currentStep >= stepNumber;
              const isCurrent = currentStep === stepNumber;
              
              let bgColor = "bg-muted text-muted-foreground border-background";
              let textColor = "text-muted-foreground";
              
              if (isCompleted) {
                bgColor = "bg-primary text-primary-foreground border-primary";
                textColor = "text-foreground font-medium";
              }
              if (isCurrent) {
                bgColor = "bg-primary text-primary-foreground border-primary ring-4 ring-primary/20";
                textColor = "text-primary font-bold";
              }

              return (
                <div key={key} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors duration-300 ease-in-out ${bgColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-background shadow-sm transition-all duration-300 ease-in-out">
                    <p className={textColor}>{config.label}</p>
                    {isCurrent && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {stepNumber === 1 && "Aguardando confirmação do pagamento..."}
                        {stepNumber === 2 && "Pagamento recebido! Logo começaremos o preparo."}
                        {stepNumber === 3 && "Sua comida está sendo preparada com carinho."}
                        {stepNumber === 4 && "Pronto! Aguardando o entregador coletar."}
                        {stepNumber === 5 && "O entregador está a caminho do seu endereço."}
                        {stepNumber === 6 && "Pedido entregue com sucesso! Bom apetite."}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status === 'delivering' && (
        <div className="bg-primary/10 border border-primary/20 p-6 rounded-xl text-center mb-8">
          <h3 className="font-bold text-lg mb-2">Seu pedido chegou?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Confirme o recebimento para nos ajudar a finalizar a entrega no sistema.
          </p>
          <Button 
            size="lg" 
            onClick={handleConfirmDelivery}
            disabled={confirmingDelivery}
            className="w-full sm:w-auto"
          >
            {confirmingDelivery ? 'Confirmando...' : 'Recebi meu pedido!'}
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button render={<Link href="/" />} variant="outline" size="lg" nativeButton={false}>
          Voltar ao Cardápio
        </Button>
      </div>
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
