# Relatório de Auditoria de Segurança — Rodada 2

**Data:** 13/ago/2026  
**Auditor:** security-auditor  
**Escopo:** Verificação da implementação do `seguranca-remediacao.md` (SEC-01 a SEC-08) + caça a brechas remanescentes.  
**Stack:** Next.js 16, Clerk, Drizzle/Neon, Upstash Redis, UploadThing, Asaas, Google Maps.

---

## Sumário Executivo

O plano de remediação foi **majoritariamente implementado com qualidade alta**. Os pontos mais críticos do relatório original — adulteração de checkout, IDOR em pedidos, webhooks sem validação, exposição de `costPrice` — foram corrigidos de forma robusta. Restam **3 achados de severidade média/alta** que passaram pela primeira rodada e **1 item do plano (SEC-08) não iniciado**.

| Severidade | Achados |
|---|---|
| 🔴 Alta | 1 (RBAC inconsistente em 28 pontos) |
| 🟠 Média | 3 (race no webhook Asaas, CSRF em POSTs públicos, bypass de webhook em dev) |
| 🟡 Baixa | 4 |
| ℹ️ Info | 3 |

---

## PARTE 1 — Verificação da implementação (SEC-01 a SEC-08)

### SEC-01 — Conter rotas de pedido expostas — ✅ IMPLEMENTADO

- `GET /api/pedidos` exige `can(role, 'view_orders')` (`src/app/api/pedidos/route.ts:12`).
- `POST /api/pedidos` legado foi removido.
- `GET /api/pedidos/[id]` exige `view_orders`; `PATCH` exige `manage_orders`.
- Acompanhamento de convidado usa **token aleatório de 32 bytes**, armazenado somente como **hash SHA-256** com expiração de 7 dias (`src/lib/order-tracking.ts`).
- `getTrackableOrder()` valida token via `timingSafeEqual` antes de devolver o pedido (`src/lib/order-access.ts:11`).
- UUID do pedido **nunca** é autorização isolada.

### SEC-02 — Tornar checkout imune a adulteração — ✅ IMPLEMENTADO (excelente)

- Schema Zod `.strict()` com UUIDs, limites de quantidade (max 20), limite de itens (max 20), limite de adicionais (max 20) (`src/lib/checkout.ts:31-44`).
- Preço, subtotal e total **recalculados no servidor** a partir do catálogo no banco (`src/app/api/checkout/route.ts:72-113`).
- Adicionais validados contra DB; duplicatas rejeitadas.
- Cotação de frete com **TTL de 15 min** e **addressHash** — checkout revalida antes de cobrar.
- Transação atômica para inserir pedido + itens + adicionais.
- Valor enviado ao Asaas = `totalCents / 100` calculado no servidor.
- Pedido marcado `cancelled` se a criação do pagamento falhar.
- Verificação de pedido mínimo.

### SEC-03 — Fechar transições e reembolsos — ⚠️ PARCIALMENTE IMPLEMENTADO

**O que está correto:**
- Máquina de estados explícita em `transitionStaffOrder()` (`src/lib/order-status.ts:19-27`).
- Cancelamento exige `canCancel` + chama `refundPayment`/`deletePayment` no Asaas.
- Concorrência otimista: `WHERE status = currentStatus` na transição de staff (`order-status.ts:75`).
- `confirmOrderDelivery` (token) só permite `delivering → delivered` com guarda `WHERE status='delivering'` (`confirmacao/actions.ts:36`).

**Lacuna (ver FINDING-01):** A função central `can()` existe em `src/lib/permissions.ts`, mas **28 rotas/actions ainda usam verificação ad-hoc** `(sessionClaims?.metadata as any)?.role` com comparação de string manual, ignorando a matriz de permissões.

### SEC-04 — Proteger webhooks e abuso de HTTP — ✅ IMPLEMENTADO (com ressalva)

- **Webhook Asaas:** token obrigatório (fail-closed), `timingSafeEqual` com hash, validação Zod (`src/app/api/webhooks/asaas/route.ts:28-45`).
- **Webhook Clerk:** secret obrigatório, limite de corpo (1 MB), corpo bruto para Svix, `wh.verify()` (`src/app/api/webhooks/clerk/route.ts:9-68`).
- **Rate limit distribuído** via Upstash; falha fechada (503) em produção sem Redis (`src/lib/rate-limit.ts:54-56`).
- Limites: checkout 3/15min, frete 20/15min, status 30/min, upload 10/15min — todos implementados.
- Rate limit duplo no checkout: por IP **e** por hash de identidade (email+telefone).

**Ressalva (ver FINDING-02):** O webhook do Asaas tem uma race condition TOCTOU — o `UPDATE` não inclui `WHERE status='pending'`.

### SEC-05 — Reduzir exposição de dados e XSS — ✅ IMPLEMENTADO

- `costPrice` **excluído** de respostas públicas via `publicProductColumns` (`src/lib/public-catalog.ts:1-11`).
- Rotas públicas de produto usam `publicProductColumns` em ambos `GET /api/produtos` e `GET /api/produtos/[id]`.
- **CSP com nonce + `strict-dynamic`** implementado em `src/proxy.ts:30-45` (não é Report-Only — já bloqueia).
- Sem `unsafe-inline` amplo em `script-src` (apenas em `style-src`, aceitável para Next.js/Tailwind).
- `form-action` restrito a `'self'` + Asaas.
- Logs do Asaas e Google Maps redigidos (apenas status/error name, sem chaves ou PII).
- Headers de segurança em `next.config.ts` (HSTS, X-Frame-Options: DENY, nosniff, Referrer-Policy, Permissions-Policy).

### SEC-06 — Privacidade, segredos e uploads — ✅ IMPLEMENTADO

- `.env` com permissão **600** (owner-only). `.env*` no `.gitignore`.
- Cart store (`cart-store.ts`): `partialize` persiste **apenas `items`** (com `comment` removido). `checkoutData` (CPF, telefone, email, endereço) **não é persistido** em localStorage.
- UploadThing: valida MIME type + extensão + **magic bytes** (JPEG/PNG/WebP); SVG rejeitado. Re-baixa o arquivo pós-upload para conferir assinatura e deleta se inválido (`src/app/api/uploadthing/core.ts:47-60`).
- Rate limit por usuário+IP no upload.
- Hosts de push notification validados contra allowlist (FCM, Mozilla, Apple).

### SEC-07 — Atualizar dependências — ✅ IMPLEMENTADO

- `npm audit --omit=dev` → **0 vulnerabilidades**.
- Next.js `^16.3.0`, Clerk `^7.6.2`, UploadThing `^7.7.4`, Sharp `^0.34.5`, svix `^1.92.2`.
- `effect` pinado em override (`3.22.1`).

### SEC-08 — Testes de regressão — ❌ NÃO IMPLEMENTADO

- Nenhum framework de teste instalado (sem Jest, Vitest, Playwright).
- Nenhum script de teste no `package.json`.
- Sem `eslint-plugin-security`.
- Este é o único item do plano totalmente pendente.

---

## PARTE 2 — Novas brechas que passaram pela primeira inspeção

### 🔴 FINDING-01 — RBAC inconsistente: 28 rotas/actions ignoram `can()` central

**Severidade:** Alta  
**Arquivos afetados (28 ocorrências):**
- `src/app/api/produtos/route.ts:60` (POST)
- `src/app/api/produtos/[id]/route.ts:59,155` (PUT, DELETE)
- `src/app/api/categorias/route.ts:33` (POST)
- `src/app/api/categorias/[id]/route.ts:20,79` (PUT, DELETE)
- `src/app/api/despesas/route.ts:15,42` (GET, POST)
- `src/app/api/despesas/[id]/route.ts:19,62` (PUT, DELETE)
- `src/app/(dashboard)/produtos/actions.ts:24,93,155`
- `src/app/(dashboard)/produtos/adicionais-actions.ts:18,46,70`
- `src/app/(dashboard)/categorias/actions.ts:15,34,57`
- `src/app/(dashboard)/financeiro/actions.ts:11,31,44`
- `src/app/(dashboard)/configuracoes/actions.ts:11,48`
- `src/app/(dashboard)/dashboard/page.tsx:14`
- `src/app/(dashboard)/financeiro/page.tsx:11`
- `src/app/(dashboard)/configuracoes/page.tsx:11`
- `src/app/(dashboard)/funcionarios/page.tsx:10`

**Problema:** Todas essas rotas usam o padrão:
```ts
const role = (sessionClaims?.metadata as any)?.role;
if (role !== 'dono' && role !== 'gerente') { ... }
```
em vez do `can(role, 'manage_products')` centralizado. O SEC-03 pedia "checagem central `can(role, action)`".

**Impacto:**
1. **Bypass de matriz de permissões:** se as permissões de `gerente` mudarem na matriz `can()` (ex.: remover `manage_products`), estas rotas **continuam permitindo** acesso — divergem silenciosamente.
2. **Sem type safety:** `as any` aceita qualquer valor; role `undefined` ou malformada não é tratada por `isRole()`.
3. **Difícil auditoria:** não há ponto único para verificar o modelo RBAC.
4. **Inconsistência de negócio:** `funcionarios/page.tsx:10` lê a role mas `funcionarios/route.ts` já usa `can(role, 'manage_staff')` corretamente — o guardião da página e o da API divergem.

**Correção sugerida:** Substituir todas as 28 ocorrências por `getRoleFromClaims(sessionClaims)` + `can(role, '<action>')`.

---

### 🟠 FINDING-02 — Race condition (TOCTOU) no webhook do Asaas

**Severidade:** Média  
**Arquivo:** `src/app/api/webhooks/asaas/route.ts:77-90`

**Problema:** A transição `pending → paid` faz:
```ts
if (order.status === 'pending') {          // check (linha 77)
  await db.update(orders)
    .set({ status: 'paid', ... })
    .where(eq(orders.id, order.id))         // update SEM guarda de status (linha 82)
```
O `WHERE` não inclui `eq(orders.status, 'pending')`. Dois webhooks `PAYMENT_RECEIVED` concorrentes podem ambos passar no check e executar o update. Compare com `transitionStaffOrder` (linha 75) e `confirmOrderDelivery` (linha 36) que **corretamente** usam `and(eq(id), eq(status, currentStatus))`.

**Impacto:** Notificações push duplicadas; em cenário extremo, reentrância em estados futuros. O plano SEC-04 pedia "idempotência por evento/pagamento".

**Correção sugerida:**
```ts
.where(and(eq(orders.id, order.id), eq(orders.status, 'pending')))
```
e verificar se `updatedOrder` é nulo (já foi processado).

---

### 🟠 FINDING-03 — Sem verificação de Origin/CSRF em endpoints POST públicos

**Severidade:** Média  
**Arquivos:** `src/app/api/checkout/route.ts`, `src/app/api/frete/route.ts`

**Problema:** Estas rotas são públicas (sem auth Clerk) e aceitam POST JSON. Não validam header `Origin` ou `Referer`. Um ataque CSRF cross-origin pode forjar POSTs para `/api/checkout` criando pedidos/clientes Asaas falsos com dados do atacante.

O rate limit mitiga volume, mas não impede um único pedido fraudulento por janela. Server Actions do Next.js têm proteção CSRF nativa, mas rotas de API não.

**Impacto:** Criação de pedidos fantasmas e clientes Asaas spam; poluição de banco; potencial abuso do gateway de pagamento.

**Correção sugerida:** Validar `Origin`/`Referer` contra `NEXT_PUBLIC_APP_URL` no topo de rotas POST públicas, ou exigir header customizado (`X-Requested-With`) que browsers não enviam cross-origin sem preflight.

---

### 🟠 FINDING-04 — Mecanismo de bypass de webhook Clerk em código de produção

**Severidade:** Média (baixa se NODE_ENV sempre correto)  
**Arquivo:** `src/app/api/webhooks/clerk/route.ts:39-52`

**Problema:** Existe um caminho de bypass controlado por headers `x-test-bypass` + `x-test-bypass-key` + env `CLERK_BYPASS_KEY`, ativo quando `NODE_ENV === 'development'`. Se houver erro de configuração de deploy (ex.: Vercel preview com NODE_ENV incorreto) ou se a chave vazar, um atacante pode forjar eventos de webhook Clerk (criar usuários, setar roles).

**Correção sugerida:** Remover o bypass do código de produção via feature flag explícita (`process.env.ENABLE_WEBHOOK_BYPASS === 'true'`) ou usar mock no nível de teste, não no handler de produção.

---

### 🟡 FINDING-05 — IP do rate limit confia cegamente em headers do cliente

**Severidade:** Baixa  
**Arquivo:** `src/lib/rate-limit.ts:42-47`

**Problema:** `getRequestIp()` lê `x-vercel-forwarded-for` depois `x-forwarded-for`. No Vercel, `x-forwarded-for` é sobrescrito pela infra — seguro. Mas o fallback `forwardedIp` (primeiro item de `x-forwarded-for`) pode ser spoofado se o app rodar atrás de proxy mal configurado ou fora do Vercel, permitindo bypass de rate limit rodando IPs falsos.

**Correção sugerida:** Documentar que o deploy deve ser no Vercel, ou usar apenas `x-vercel-forwarded-for` e rejeitar se ausente em produção.

---

### 🟡 FINDING-06 — Cotação de frete não é single-use

**Severidade:** Baixa  
**Arquivo:** `src/app/api/checkout/route.ts:54-60`

**Problema:** A `deliveryQuote` é validada por TTL e addressHash, mas não é consumida/marcada após o uso. O mesmo `deliveryQuoteId` pode ser reusado em múltiplos checkouts dentro da janela de 15 min. Como o checkout recalcula tudo no servidor, o impacto financeiro é nulo — mas permite reusar uma cotação para múltiplos pedidos.

**Correção sugerida:** Marcar a cotação como usada (coluna `consumedAt`) ou deletá-la após o checkout bem-sucedido.

---

### 🟡 FINDING-07 — API pública de produtos expõe itens indisponíveis

**Severidade:** Baixa  
**Arquivo:** `src/app/api/produtos/route.ts:8-50`

**Problema:** `GET /api/produtos` só filtra `isAvailable=true` se o cliente explicitamente passar `?isAvailable=true`. Sem o parâmetro, retorna todos os produtos incluindo indisponíveis. Embora `costPrice` não vaze (DTO público), um anônimo pode enumerar produtos fora do catálogo ativo.

**Correção sugerida:** Para requisições sem auth de staff, forçar `isAvailable=true`.

---

### 🟡 FINDING-08 — Arquivo de teste legado com chave de API no diretório de rotas

**Severidade:** Baixa  
**Arquivo:** `src/app/api/frete/test-google.js`

**Problema:** Script Node.js legado que carrega `.env` via `dotenv` e faz chamadas diretas à Google Maps API. Está dentro de `src/app/api/frete/`. Embora não seja uma route handler (é `.js`, não `route.ts`), é código morto no path da API que carrega segredos. Pode ser empacotado acidentalmente ou causar confusão.

**Correção sugerida:** Mover para `scripts/` ou deletar.

---

### ℹ️ FINDING-09 — Header `X-XSS-Protection` depreciado

**Severidade:** Info  
**Arquivo:** `next.config.ts:28`

**Problema:** `X-XSS-Protection: 1; mode=block` é depreciado e pode introduzir vulnerabilidades em browsers antigos. O CSP moderno (`proxy.ts`) já cobre isso. OWASP recomenda removê-lo ou setar `0`.

---

### ℹ️ FINDING-10 — `style-src 'unsafe-inline'` na CSP

**Severidade:** Info  
**Arquivo:** `src/proxy.ts:39`

**Problema:** A CSP tem `style-src 'self' 'unsafe-inline'`. Embora seja comummente necessário para Next.js (injected styles) e o plano focava em eliminar `unsafe-inline` amplo de **scripts** (o qual foi feito com nonce), `unsafe-inline` em styles ainda permite exfiltração de dados via CSS em cenários específicos. Aceitável como tradeoff atual, mas registrar como dívida técnica.

---

### ℹ️ FINDING-11 — Ausência total de testes (SEC-08 não iniciado)

**Severidade:** Info (mas bloqueia confiança em deploy)  
**Problema:** Sem framework de testes, sem scripts de teste, sem `eslint-plugin-security`. O SEC-08 é a última etapa do plano e não foi iniciado. Sem testes de regressão para RBAC, IDOR, preço adulterado, webhook e rate limit, não há garantia de que correções não regrediram em mudanças futuras.

---

## Priorização de correção

| Prioridade | Finding | Esforço |
|---|---|---|
| 1 | FINDING-01 (RBAC inconsistente) | Médio — refatorar 28 pontos para `can()` |
| 2 | FINDING-02 (race no webhook Asaas) | Pequeno — adicionar `eq(status)` no WHERE |
| 3 | FINDING-03 (CSRF em POSTs públicos) | Pequeno — middleware de Origin |
| 4 | FINDING-04 (bypass de webhook dev) | Pequeno — feature flag ou remover |
| 5 | FINDING-07 (produtos indisponíveis) | Pequeno — forçar filtro |
| 6 | FINDING-06 (quote não single-use) | Pequeno — marcar consumida |
| 7 | FINDING-08 (test-google.js) | Trivial — mover/deletar |
| 8 | SEC-08 (testes) | Grande — instalar framework + escrever suíte |

---

## Conclusão

O núcleo de segurança (checkout imune a adulteração, IDOR fechado, webhooks validados, rate limit distribuído, uploads verificados, `costPrice` isolado) está **solidamente implementado**. Os riscos remanescentes são: (1) inconsistência de RBAC que pode divergir do modelo central, (2) race condition no webhook, e (3) falta de CSRF/Origin check em POSTs públicos. Nenhum deles permite roubo direto de dados ou manipulação de preços, mas devem ser corrigidos antes do deploy de produção.
