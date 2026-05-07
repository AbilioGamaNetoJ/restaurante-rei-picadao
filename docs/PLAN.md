# Plano de Implementação: Fase 7 & 8 (Orquestração)

Este plano detalha a implementação das rotas de API remanescentes e as integrações externas necessárias para o sistema do **Rei do Picadão**.

## Escopo da Fase 7: API Routes
Implementação de rotas para gerenciamento de dados e processos do sistema, garantindo segurança via Clerk e RBAC.

| Endpoint | Métodos | Permissão | Status |
|---|---|---|---|
| `/api/produtos` | GET, POST | GET: Público, POST: Dono/Gerente | ✅ Concluído |
| `/api/produtos/[id]` | GET, PUT, DELETE | Dono/Gerente | ✅ Concluído |
| `/api/pedidos` | GET, POST | GET: Auth, POST: Público | ✅ Concluído |
| `/api/pedidos/[id]` | GET, PATCH | Auth | ✅ Concluído |
| `/api/categorias` | GET, POST, PUT, DELETE | GET: Público, RESTO: Dono/Gerente | ✅ Concluído |
| `/api/despesas` | GET, POST, PUT, DELETE | Dono | ✅ Concluído |
| `/api/funcionarios` | GET, POST, DELETE | Dono/Gerente | ✅ Concluído |
| `/api/uploadthing` | POST | Dono/Gerente | ✅ Concluído |
| `/api/webhooks/clerk` | POST | Clerk Secret | ✅ Concluído |

## Escopo da Fase 8: Integrações Externas
Refinamento das integrações já iniciadas e conclusão das pendentes.

1. **Clerk Webhook**: Sincronização de usuários e roles.
2. **UploadThing**: Configuração final do FileRouter e validação de upload.
3. **Google Maps (Routes API)**: Validação final do cálculo de frete.
4. **Asaas**: Tratamento completo de webhooks (pago, vencido, cancelado).

---

## Divisão de Tarefas por Agente

### 1. Backend Specialist (`backend-specialist`)
- Criar os arquivos `route.ts` para cada endpoint pendente.
- Implementar a lógica de negócio usando Drizzle ORM.
- Configurar os handlers de Webhooks (Clerk e Asaas).

### 2. Security Auditor (`security-auditor`)
- Validar o Middleware de RBAC em cada rota.
- Garantir que segredos (Secrets) de webhooks estão sendo validados corretamente.
- Auditar o acesso a dados sensíveis (Financeiro/Funcionários).

### 3. Test Engineer (`test-engineer`)
- Criar scripts de teste para validar cada endpoint (usando `curl` ou similar).
- Verificar respostas de erro (401, 403, 404).
- Validar o fluxo completo de checkout até o webhook de pagamento.

---

## Plano de Verificação
- [x] Lint check em todos os novos arquivos.
- [x] Verificação de tipos TypeScript.
- [x] Testes manuais de cada endpoint via Postman/Curl e scripts.
- [x] Scan de segurança básico e auditoria de RBAC.

---

## Próximos Passos
Após sua aprovação, os agentes atuarão em paralelo para implementar estas funcionalidades.

**Aprova este plano para iniciarmos a Fase 2 (Implementação)?**
