import * as React from 'react';
import { db } from '@/db';
import { orders, orderItems, orderItemAddons } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { PedidosClient } from './pedidos-client';

export default async function PedidosPage() {
  const allOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: {
      items: {
        with: {
          product: {
            columns: {
              imageUrl: true
            }
          },
          addons: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Fila de Pedidos</h2>
        <p className="text-muted-foreground">
          Gerencie os pedidos recebidos.
        </p>
      </div>

      <PedidosClient initialOrders={allOrders} />
    </div>
  );
}
