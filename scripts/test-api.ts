import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001/api';

async function testEndpoints() {
  console.log('🚀 Iniciando testes de API...\n');

  // 1. Teste GET Produtos (Público)
  try {
    const res = await fetch(`${API_URL}/produtos`);
    if (res.ok) {
      console.log('✅ GET /produtos: Sucesso (Público)');
    } else {
      console.error('❌ GET /produtos: Falhou', res.status);
    }
  } catch (error: any) {
    console.error('❌ GET /produtos: Erro na requisição', error.message);
  }

  // 2. Teste GET Categorias (Público)
  try {
    const res = await fetch(`${API_URL}/categorias`);
    if (res.ok) {
      console.log('✅ GET /categorias: Sucesso (Público)');
    } else {
      console.error('❌ GET /categorias: Falhou', res.status);
    }
  } catch (error: any) {
    console.error('❌ GET /categorias: Erro na requisição', error.message);
  }

  // 3. Teste POST Produto (Sem Auth - Esperado 401 ou 403)
  try {
    const res = await fetch(`${API_URL}/produtos`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Teste' }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.status === 401 || res.status === 403) {
      console.log('✅ POST /produtos: Bloqueado corretamente (RBAC)');
    } else {
      console.error('❌ POST /produtos: Erro inesperado', res.status);
    }
  } catch (error: any) {
    console.error('❌ POST /produtos: Erro na requisição', error.message);
  }

  // 4. Teste GET Pedidos (Sem Auth - Esperado 401 ou 403)
  try {
    const res = await fetch(`${API_URL}/pedidos`);
    if (res.status === 401 || res.status === 403) {
      console.log('✅ GET /pedidos: Bloqueado corretamente (RBAC)');
    } else {
      console.error('❌ GET /pedidos: Erro inesperado', res.status);
    }
  } catch (error: any) {
    console.error('❌ GET /pedidos: Erro na requisição', error.message);
  }

  console.log('\n🏁 Testes básicos concluídos.');
}

testEndpoints();
