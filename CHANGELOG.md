# Changelog

Todos os mudancas notaveis deste projeto serao documentadas neste arquivo.

O formato e baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [0.2.3] - 2026-08-13

### Qualidade de codigo

Resolvidas as ocorrencias apontadas no relatorio do SonarQube, sem alterar o comportamento da aplicacao.

- Adicionado `type="button"` a todos os botoes HTML nativos, evitando submits acidentais em formularios.
- Corrigido o ternario redundante no layout do dashboard.
- Ajustado o componente `Label` para renderizar `<label>` somente quando houver `htmlFor`; titulos sem controle associado usam `<span>`.
- Reduzida a complexidade cognitiva das rotas de checkout e webhook Asaas, do cliente Asaas, do fluxo de status de pedidos e dos scripts de integracao, mantendo os mesmos contratos e regras de seguranca.
- Substituidas buscas lineares por `Set`, chaves React baseadas em indice por identificadores estaveis e elementos com `role="button"` por botoes nativos acessiveis.
- Padronizados imports `node:`, reexportacoes de icones, `String.raw` para regex e `await` de nivel superior nos scripts utilitarios.
- Validado com ESLint (0 erros), TypeScript e suite Vitest (64/64 testes).

---

## [0.2.2] - 2026-08-13

### Qualidade de codigo

Resolvidas as issues reportadas pelo SonarCloud (accessibility, consistency e maintainability), sem alterar comportamento.

- **Acessibilidade (jsx-a11y)**: elementos `<div>` clicaveis sem suporte a teclado corrigidos com `role="button"`, `tabIndex={0}` e `onKeyDown` (Enter/Espaco) em `storefront-client.tsx` (card de produto), `adicionais-client.tsx` (selecao de categoria) e `produtos-client.tsx` (selecionar todos os adicionais / item de adicional).
- **`public/offline.html`**: listeners inline (`onerror`, `onclick`) substituidos por `addEventListener` em script separado; botao de retry migrado para `<button type="button">` nativo.
- **Consistencia (ES2015+)**: `String.fromCharCode` -> `String.fromCodePoint` (`uploadthing/core.ts`); `String#charCodeAt` -> `String#codePointAt` (`push-permission.tsx`); `parseFloat`/`parseInt` globais -> `Number.parseFloat`/`Number.parseInt` em `product-detail-modal.tsx`, `configuracoes-client.tsx`, `storefront-client.tsx`, `install-prompt.tsx` e `google-maps.ts`.
- **Readonly props**: props de componentes React marcadas como `Readonly<>` em ~35 componentes — todos os `*-client.tsx` do dashboard e storefront, componentes de `src/components/` (`logout-button`, `cart-drawer`, `product-detail-modal`, `closed-store-dialog`, `store-icons`) e os primitivos shadcn/ui (`badge`, `card`, `dialog`, `input`, `label`, `scroll-area`, `separator`, `sheet`, `sonner`, `table`, `tabs`).
- Validado com `tsc --noEmit`, `eslint` (0 erros), suite Vitest (64/64) e `next build` de producao.

---

## [0.2.1] - 2026-08-13

### Qualidade de codigo

Zerados os 86 erros e reduzidos os 54 warnings do ESLint/TypeScript reportados por `npm run security:scan`, sem alterar comportamento.

- **Tipagem estrita**: todas as ocorrencias de `any` em rotas de API, server actions e componentes do dashboard/storefront substituidas por tipos explicitos derivados do schema Drizzle ou dos componentes consumidores (`categorias`, `configuracoes`, `dashboard`, `financeiro`, `funcionarios`, `pedidos`, `produtos`, `storefront-client.tsx`, componentes PWA).
- **React hooks**: avisos de `setState` sincrono dentro de `useEffect` (`react-hooks/set-state-in-effect`) suprimidos com `eslint-disable-next-line` nos casos legitimos de hydration guard (`mounted`), seguindo o padrao ja existente em `dashboard-layout-client.tsx`; `isCollapsed` do sidebar do dashboard migrado para lazy-init do `useState` (elimina um `useEffect` desnecessario).
- **Limpeza**: imports, variaveis e funcoes nao utilizadas removidas (`StoreIcon`, `LineChart`/`Line`, `handleRoleChange`, `orderItems`/`orderItemAddons`, `storeSettings`, entre outros); blocos `catch` sem uso do erro convertidos para `catch {}` ou com narrowing via `instanceof Error`; aspas retas em JSX escapadas com `&quot;`.
- **Scripts utilitarios**: `scratch/` e `.opencode/` excluidos do ESLint via `globalIgnores` (scripts de debug/skill, fora do app); `any` em `scripts/*.ts` substituido por `error instanceof Error ? error.message : String(error)`.
- Restam apenas warnings nao-bloqueantes de `<img>` (sugestao de `next/image`) e um `exhaustive-deps` pre-existente.

### Alterado

- `eslint.config.mjs`: `scratch/**` e `.opencode/**` adicionados ao `globalIgnores`.

---

## [0.2.0] - 2026-08-13

### Seguranca

Remediacao completa das vulnerabilidades identificadas em duas rodadas de auditoria.

#### Plano SEC-01 a SEC-08 (primeira rodada)

- **SEC-01** Rotas de pedido: `GET /api/pedidos` limitado a `view_orders`; `POST` legado removido; leitura de pedido limitada a staff ou token de rastreio; Server Actions com autorizacao propria via `can()`.
- **SEC-02** Checkout imune a adulteracao: schemas Zod `.strict()` com UUIDs e limites de quantidade; precos/subtotal/total recalculados no servidor a partir do catalogo; cota de frete com TTL de 15 min e `addressHash`; transacao atomica para inserir pedido + itens + adicionais.
- **SEC-03** Transicoes e reembolsos: maquina de estados explicita em `transitionStaffOrder()` com concorrencia otimista (`WHERE status = currentStatus`); cancelamento exige `canCancel` e chama `refundPayment`/`deletePayment` no Asaas.
- **SEC-04** Webhooks e rate limit: Clerk com Svix signature + body bruto + limite 1 MB; Asaas com token + `timingSafeEqual`; rate limit distribuido via Upstash Redis (fail-closed 503 em producao sem Redis).
- **SEC-05** Exposicao de dados: `costPrice` excluido de respostas publicas via `publicProductColumns`; CSP com nonce + `strict-dynamic`; logs do Asaas/Maps redigidos.
- **SEC-06** Privacidade e uploads: carrinho nao persiste PII (CPF/telefone/endereco); UploadThing valida MIME + extensao + magic bytes (JPEG/PNG/WebP, sem SVG); `.env` com `chmod 600`.
- **SEC-07** Dependencias: Next.js 16.3+, Clerk 7.6, UploadThing 7.7; `npm audit --omit=dev` = 0 vulnerabilidades.
- **SEC-08** Testes: Vitest + Playwright + pipeline de CI/CD (ver adiante).

#### Rodada 2 de auditoria (FINDING-01 a FINDING-09)

- **FINDING-01** RBAC centralizado: 28 ocorrencias de `(sessionClaims?.metadata as any)?.role` substituidas por `getRoleFromClaims()` + `can()` em todas as rotas API, server actions e paginas do dashboard. Adicionada permissao `manage_finance`.
- **FINDING-02** Race condition corrigida no webhook Asaas: `UPDATE` agora inclui `WHERE status='pending'` (TOCTOU fix).
- **FINDING-03** Protecao CSRF: criado `src/lib/origin-guard.ts` validando `Origin`/`Referer` em `POST /api/checkout` e `POST /api/frete`.
- **FINDING-04** Bypass de webhook Clerk restrito: agora exige `ENABLE_WEBHOOK_BYPASS=true` alem de `NODE_ENV=development`.
- **FINDING-05** `getRequestIp()` endurecido: em producao so confia `x-vercel-forwarded-for`.
- **FINDING-06** Cota de frete single-use: coluna `consumedAt` adicionada a `delivery_quotes`; checkout marca como consumida na transacao.
- **FINDING-07** API de produtos: forca `isAvailable=true` para requisicoes de nao-staff.
- **FINDING-08** Removido `src/app/api/frete/test-google.js` (codigo morto com chamada direta a API key).
- **FINDING-09** Removido header `X-XSS-Protection` depreciado do `next.config.ts`.

### Testes e CI/CD (SEC-08)

- **Vitest** com 64 testes unitarios cobrindo RBAC (`permissions.test.ts`), tokens criptograficos (`order-tracking.test.ts`), resistencia a adulteracao de preco (`checkout.test.ts`) e protecao CSRF (`origin-guard.test.ts`).
- **Playwright** com 7 cenarios E2E de seguranca em `e2e/security.spec.ts`.
- **GitHub Actions CI** (`ci.yml`): lint + typecheck + testes + build.
- **GitHub Actions Security** (`security.yml`): Gitleaks + `npm audit`.
- **GitHub Actions SonarCloud** (`sonarcloud.yml`): analise estatica + coverage.
- **Dependabot** configurado para npm e GitHub Actions (semanal, agrupado por ecossistema).
- **eslint-plugin-security** integrado ao ESLint.
- Scripts adicionados: `test`, `test:watch`, `test:e2e`, `test:e2e:ui`, `typecheck`, `audit:prod`, `security:scan`.

### Adicionado

- `src/lib/origin-guard.ts` — validacao de Origin/Referer para protecao CSRF.
- `src/lib/checkout.test.ts` — testes de validacao de schema e adulteracao de preco.
- `src/lib/order-tracking.test.ts` — testes de token de rastreio.
- `src/lib/origin-guard.test.ts` — testes de protecao CSRF.
- `src/lib/permissions.test.ts` — testes de matriz RBAC.
- `e2e/security.spec.ts` — testes E2E de seguranca.
- `vitest.config.ts`, `playwright.config.ts`, `sonar-project.properties`.
- `.github/workflows/ci.yml`, `security.yml`, `sonarcloud.yml`.
- `.github/dependabot.yml`.
- `drizzle/0001_add_consumed_at_to_delivery_quotes.sql`.
- `auditoria-seguranca-round2.md` — relatorio de auditoria.
- `seguranca-remediacao.md` — plano de remediacao.
- `CHANGELOG.md`.

### Alterado

- `README.md` reescrito com arquitetura completa, seguranca, PWA, testes e CI/CD.
- `permissions.ts`: adicionada permissao `manage_finance`.
- `rate-limit.ts`: `getRequestIp()` nao confia `x-forwarded-for` em producao.
- `webhooks/clerk/route.ts`: bypass requer flag explicita `ENABLE_WEBHOOK_BYPASS`.
- `webhooks/asaas/route.ts`: UPDATE com guarda de status (TOCTOU fix).
- `checkout/route.ts`: origin guard + cota single-use.
- `frete/route.ts`: origin guard.
- `proxy.ts`: CSP mantida com nonce + strict-dynamic.
- `next.config.ts`: removido `X-XSS-Protection`.
- `eslint.config.mjs`: adicionado `eslint-plugin-security`.
- `schema.ts`: adicionada coluna `consumedAt` em `delivery_quotes`.
- `package.json`: adicionados scripts de teste e dependencias de dev (Vitest, Playwright, eslint-plugin-security, @vitest/coverage-v8).

### Removido

- `src/app/api/frete/test-google.js` — arquivo de teste legado.

---

## [0.1.0] - 2025

### Versao inicial

- Storefront publico com cardapio, carrinho e checkout.
- Dashboard administrativo com produtos, categorias, pedidos, financeiro, funcionarios e configuracoes.
- Integracao com Clerk (auth), Asaas (pagamentos), Google Maps (frete), UploadThing (uploads).
- PWA com manifest, service worker e push notifications.
- State management com Zustand.
- Drizzle ORM + Neon PostgreSQL.
