import 'dotenv/config';

import { db } from '../src/db';
import { orders } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001/api';
const TEST_ORDER_ID = '12345678-1234-1234-1234-123456789012';

async function testIntegrations() {
  console.log('🧪 Iniciando Testes de Integração (Fase 8)...\n');

  // 0. Preparação: Garantir que o pedido de teste existe
  console.log('🗄️ Preparando banco de dados...');
  try {
    // Limpar primeiro para garantir consistência
    await db.delete(orders).where(eq(orders.id, TEST_ORDER_ID));
    
    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, TEST_ORDER_ID)
    });

    if (existing) {
      console.log(`ℹ️ Pedido de teste já existe: ID=${existing.id}, Status=${existing.status}`);
    } else {
      await db.insert(orders).values({
        id: TEST_ORDER_ID,
        customerName: 'Teste Integração',
        customerEmail: 'teste@exemplo.com',
        customerPhone: '11999999999',
        addressStreet: 'Rua de Teste',
        addressNumber: '123',
        addressNeighborhood: 'Bairro Teste',
        addressCity: 'Cidade',
        addressState: 'TS',
        addressZip: '00000-000',
        distanceKm: '1.0',
        subtotal: '90.00',
        deliveryFee: '10.00',
        total: '100.00',
        status: 'pending'
      });
      console.log('✅ Pedido de teste criado.');
    }
  } catch (err: any) {
    console.error('❌ Erro ao preparar banco:', err.message);
  }

  // 1. Teste de Frete (Google Maps)
  console.log('\n📡 Testando Cálculo de Frete...');
  try {
    const res = await fetch(`${API_URL}/frete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addressStreet: 'Rua das Flores',
        addressNumber: '100',
        addressCity: 'Florianópolis',
        addressState: 'SC',
        addressZip: '88000-000'
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Frete: OK (Distância: ${data.distanceKm}km, Valor: R$${data.deliveryFee})`);
    } else {
      console.log(`❌ Frete: Erro (${res.status}): ${data.error}`);
    }
  } catch (err: any) {
    console.error('❌ Frete: Erro na requisição', err.message);
  }

  // 2. Teste de Webhook Asaas (Simulação)
  console.log('\n💳 Testando Webhook Asaas (Simulação de Pagamento)...');
  try {
    const res = await fetch(`${API_URL}/webhooks/asaas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'asaas-access-token': process.env.ASAAS_WEBHOOK_TOKEN || 'test-token'
      },
      body: JSON.stringify({
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_12345',
          externalReference: '12345678-1234-1234-1234-123456789012',
          billingType: 'PIX',
          status: 'RECEIVED'
        }
      })
    });
    if (res.ok) {
      console.log('✅ Webhook Asaas: Recebido com sucesso');
      
      // Verificar se o status foi atualizado no banco
      console.log(`🔍 Buscando pedido ID: ${TEST_ORDER_ID}`);
      const results = await db.select().from(orders).where(eq(orders.id, TEST_ORDER_ID));
      const updatedOrder = results[0];
      
      if (updatedOrder) {
        console.log(`📦 Conteúdo do pedido: Status=${updatedOrder.status}, PaymentStatus=${updatedOrder.paymentStatus}`);
        if (updatedOrder.status === 'paid') {
          console.log('✅ Banco de Dados: Status do pedido atualizado para "paid"');
        } else {
          console.log(`❌ Banco de Dados: Status esperado "paid", mas está "${updatedOrder.status}"`);
        }
      } else {
        console.log('❌ Banco de Dados: Pedido NÃO encontrado após o webhook');
      }
    } else {
      const data = await res.json().catch(() => ({}));
      console.log(`❌ Webhook Asaas: Falhou (${res.status})`, data.error || '');
    }
  } catch (err: any) {
    console.error('❌ Webhook Asaas: Erro na requisição', err.message);
  }

  // 3. Teste de Webhook Clerk (Simulação de Usuário)
  console.log('\n👤 Testando Webhook Clerk (Simulação de Atualização de Usuário)...');
  try {
    const res = await fetch(`${API_URL}/webhooks/clerk`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'svix-id': 'test_id',
        'svix-timestamp': Date.now().toString(),
        'svix-signature': 'test_sig',
        'x-test-bypass': 'true'
      },
      body: JSON.stringify({
        type: 'user.updated',
        data: {
          id: 'user_2m1zGZ8Bf68A8b7D0f6g5h4j3k2l',
          email_addresses: [{ email_address: 'test@example.com' }]
        }
      })
    });
    if (res.ok) {
      console.log('✅ Webhook Clerk: Recebido com sucesso (Bypass)');
    } else {
      console.log(`❌ Webhook Clerk: Falhou (${res.status})`);
    }
  } catch (err: any) {
    console.error('❌ Webhook Clerk: Erro na requisição', err.message);
  }

  console.log('\n🏁 Fim dos testes de integração.');
}

testIntegrations();
