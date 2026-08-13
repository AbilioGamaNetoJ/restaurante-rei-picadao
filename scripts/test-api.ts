import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001/api';

type EndpointTest = {
  request: () => Promise<Response>;
  isSuccess: (response: Response) => boolean;
  successMessage: string;
  failureMessage: string;
};

async function runEndpointTest({ request, isSuccess, successMessage, failureMessage }: EndpointTest) {
  try {
    const response = await request();
    if (isSuccess(response)) {
      console.log(successMessage);
    } else {
      console.error(failureMessage, response.status);
    }
  } catch (error) {
    console.error('❌ Erro na requisição', error instanceof Error ? error.message : String(error));
  }
}

async function testEndpoints() {
  console.log('🚀 Iniciando testes de API...\n');

  await runEndpointTest({
    request: () => fetch(`${API_URL}/produtos`),
    isSuccess: (response) => response.ok,
    successMessage: '✅ GET /produtos: Sucesso (Público)',
    failureMessage: '❌ GET /produtos: Falhou',
  });

  await runEndpointTest({
    request: () => fetch(`${API_URL}/categorias`),
    isSuccess: (response) => response.ok,
    successMessage: '✅ GET /categorias: Sucesso (Público)',
    failureMessage: '❌ GET /categorias: Falhou',
  });

  await runEndpointTest({
    request: () => fetch(`${API_URL}/produtos`, {
      method: 'POST',
      body: JSON.stringify({ name: 'Teste' }),
      headers: { 'Content-Type': 'application/json' },
    }),
    isSuccess: (response) => response.status === 401 || response.status === 403,
    successMessage: '✅ POST /produtos: Bloqueado corretamente (RBAC)',
    failureMessage: '❌ POST /produtos: Erro inesperado',
  });

  await runEndpointTest({
    request: () => fetch(`${API_URL}/pedidos`),
    isSuccess: (response) => response.status === 401 || response.status === 403,
    successMessage: '✅ GET /pedidos: Bloqueado corretamente (RBAC)',
    failureMessage: '❌ GET /pedidos: Erro inesperado',
  });

  console.log('\n🏁 Testes básicos concluídos.');
}

void testEndpoints();
