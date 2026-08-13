import dotenv from 'dotenv';
dotenv.config();

import { db } from '../src/db';
import { orders } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function testOrderFlow() {
  console.log('🚀 Iniciando teste de fluxo de pedidos (Database Level)...\n');

  try {
    // 1. Criar pedido de teste
    const [newOrder] = await db.insert(orders).values({
      customerName: 'Teste Flow',
      customerEmail: 'teste@flow.com',
      customerPhone: '11999999999',
      addressStreet: 'Rua Teste',
      addressNumber: '123',
      addressNeighborhood: 'Bairro Teste',
      addressCity: 'Cidade Teste',
      addressState: 'SP',
      addressZip: '01234567',
      distanceKm: '5.5',
      deliveryFee: '10.00',
      subtotal: '50.00',
      total: '60.00',
      status: 'pending'
    }).returning();

    console.log(`✅ Pedido criado: ${newOrder.id} (Status: ${newOrder.status})`);

    const statuses = ['paid', 'preparing', 'ready', 'delivering', 'delivered'] as const;

    for (const status of statuses) {
      await db.update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, newOrder.id));
      
      const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, newOrder.id));
      
      if (updatedOrder.status === status) {
        console.log(`  ➡️ Transição para: ${status.padEnd(10)} | [OK]`);
      } else {
        console.error(`  ❌ Falha na transição para: ${status}`);
      }
    }

    // Limpeza
    await db.delete(orders).where(eq(orders.id, newOrder.id));
    console.log('\n✅ Teste de fluxo concluído com sucesso.');

  } catch (error) {
    console.error('❌ Erro no teste de fluxo:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

testOrderFlow();
