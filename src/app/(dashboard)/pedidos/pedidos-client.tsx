'use client';

import * as React from 'react';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, ChevronLeft, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { updateOrderStatus, deleteOrder } from './actions';

type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

type OrderAddon = {
  id: string;
  addonName: string;
  quantity: number;
  imageUrl: string | null;
};

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  subtotal: string;
  comment: string | null;
  product: { imageUrl: string | null } | null;
  addons: OrderAddon[];
};

type DashboardOrder = {
  id: string;
  status: OrderStatus;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string | null;
  addressNeighborhood: string;
  addressCity: string;
  deliveryFee: string;
  total: string;
  items: OrderItem[];
};

const statusMap: Record<OrderStatus, { label: string; color: string; next?: { status: OrderStatus; label: string } }> = {
  pending: { label: 'Aguardando Pagamento', color: 'bg-yellow-500' },
  paid: { label: 'Pago', color: 'bg-blue-500', next: { status: 'preparing', label: 'Iniciar Preparo' } },
  preparing: { label: 'Preparando', color: 'bg-purple-500', next: { status: 'ready', label: 'Pronto para Entrega' } },
  ready: { label: 'Pronto', color: 'bg-orange-500', next: { status: 'delivering', label: 'Saiu para Entrega' } },
  delivering: { label: 'Em Rota', color: 'bg-indigo-500', next: { status: 'delivered', label: 'Entregue' } },
  delivered: { label: 'Entregue', color: 'bg-green-500' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500' },
};

const tabs: { value: string; label: string; statuses: OrderStatus[] }[] = [
  { value: 'active', label: 'Ativos', statuses: ['pending', 'paid', 'preparing', 'ready', 'delivering'] },
  { value: 'completed', label: 'Finalizados', statuses: ['delivered'] },
  { value: 'cancelled', label: 'Cancelados', statuses: ['cancelled'] },
];


const REFRESH_INTERVAL_MS = 15000;

export function PedidosClient({ initialOrders }: Readonly<{ initialOrders: DashboardOrder[] }>) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('active');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const activeTabConfig = tabs.find(t => t.value === activeTab)!;
  
  // Filtragem baseada na aba e na data (se não for a aba "Ativos")
  const filteredOrders = initialOrders.filter(order => {
    const statusMatch = activeTabConfig.statuses.includes(order.status);
    if (!statusMatch) return false;
    
    if (activeTab === 'active') return true;
    
    const orderDate = new Date(order.createdAt);
    return (
      orderDate.getMonth() === selectedDate.getMonth() &&
      orderDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const currentMonthLabel = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total), 0);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus);
        toast.success(`Status atualizado para ${statusMap[newStatus].label}`);
        refresh();
      } catch {
        toast.error('Erro ao atualizar status');
      }
    });
  };

  const handleDelete = (orderId: string) => {
    if (!confirm('Deseja realmente excluir este pedido cancelado? Esta ação é irreversível.')) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteOrder(orderId);
        toast.success('Pedido excluído com sucesso');
        refresh();
      } catch {
        toast.error('Erro ao excluir pedido');
      }
    });
  };

  function renderOrderCard(order: DashboardOrder) {
    const config = statusMap[order.status as OrderStatus];
    
    return (
      <Card key={order.id} className="flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">#{order.id.slice(0, 8)}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleString('pt-BR')}
              </p>
            </div>
            <Badge className={config.color}>{config.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Endereço:</p>
            <p className="text-sm text-muted-foreground">
              {order.addressStreet}, {order.addressNumber} {order.addressComplement && `- ${order.addressComplement}`}
              <br />
              {order.addressNeighborhood}, {order.addressCity}
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="text-sm">
                <div className="flex justify-between font-medium items-start">
                  <div className="flex gap-2">
                    {item.product?.imageUrl && (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.productName} 
                        className="w-10 h-10 rounded-md object-cover flex-shrink-0 border border-muted" 
                      />
                    )}
                    <span className="mt-0.5">{item.quantity}x {item.productName}</span>
                  </div>
                  <span className="mt-0.5">R$ {Number(item.subtotal).toFixed(2)}</span>
                </div>
                {item.addons?.length > 0 && (
                  <div className="pl-4 text-xs text-muted-foreground space-y-1 mt-1">
                    {item.addons.map((addon) => (
                      <div key={addon.id} className="flex items-center gap-2">
                        {addon.imageUrl && (
                          <img 
                            src={addon.imageUrl} 
                            alt={addon.addonName} 
                            className="w-6 h-6 rounded object-cover flex-shrink-0 border border-muted" 
                          />
                        )}
                        <span>+ {addon.quantity}x {addon.addonName}</span>
                      </div>
                    ))}
                  </div>
                )}
                {item.comment && (
                  <div className="pl-4 text-xs italic text-muted-foreground/80">
                    Obs: {item.comment}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <Separator />
          
          <div className="flex justify-between font-bold">
            <span>Total (com frete R$ {Number(order.deliveryFee).toFixed(2)})</span>
            <span>R$ {Number(order.total).toFixed(2)}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex gap-2">
          {config.next && (
            <Button 
              className="flex-1" 
              onClick={() => handleUpdateStatus(order.id, config.next!.status)}
              disabled={isPending}
            >
              {config.next.label}
            </Button>
          )}
          {['pending', 'paid'].includes(order.status) && (
            <Button 
              variant="destructive" 
              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
              disabled={isPending}
            >
              Cancelar
            </Button>
          )}
          {order.status === 'cancelled' && (
            <Button 
              variant="destructive" 
              className="flex-1"
              onClick={() => handleDelete(order.id)}
              disabled={isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 pb-4 overflow-x-auto items-center">
        {tabs.map(tab => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          onClick={refresh}
          title="Atualizar pedidos"
          className="ml-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {activeTab !== 'active' && (
        <div className="flex items-center justify-between bg-card border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg capitalize">{currentMonthLabel}</h3>
              <p className="text-sm text-muted-foreground">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeTab === 'completed' && (
              <div className="hidden sm:block mr-4 text-right">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Receita Total</p>
                <p className="font-bold text-green-600">R$ {totalRevenue.toFixed(2)}</p>
              </div>
            )}
            <div className="flex bg-muted rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevMonth}
                title="Mês Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Separator orientation="vertical" className="h-8 mx-1" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNextMonth}
                title="Próximo Mês"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Nenhum pedido encontrado para este período.</p>
          {activeTab !== 'active' && (
            <p className="text-xs text-muted-foreground mt-1">Tente navegar entre os meses para ver o histórico.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map(order => renderOrderCard(order))}
        </div>
      )}
    </div>
  );
}
