'use client';

import * as React from 'react';


import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { updateOrderStatus } from './actions';

type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

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

export function PedidosClient({ initialOrders }: { initialOrders: any[] }) {
  const [activeTab, setActiveTab] = useState('active');
  const [isPending, startTransition] = useTransition();

  const activeTabConfig = tabs.find(t => t.value === activeTab)!;
  const filteredOrders = initialOrders.filter(order => activeTabConfig.statuses.includes(order.status));

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, newStatus);
        toast.success(`Status atualizado para ${statusMap[newStatus].label}`);
      } catch (error) {
        toast.error('Erro ao atualizar status');
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 pb-4 overflow-x-auto">
        {tabs.map(tab => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            Nenhum pedido encontrado.
          </div>
        ) : (
          filteredOrders.map(order => {
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
                    {order.items.map((item: any) => (
                      <div key={item.id} className="text-sm">
                        <div className="flex justify-between font-medium">
                          <span>{item.quantity}x {item.productName}</span>
                          <span>R$ {Number(item.subtotal).toFixed(2)}</span>
                        </div>
                        {item.addons?.length > 0 && (
                          <div className="pl-4 text-xs text-muted-foreground">
                            {item.addons.map((addon: any) => (
                              <div key={addon.id}>+ {addon.quantity}x {addon.addonName}</div>
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
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
