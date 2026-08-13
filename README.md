# Rei do Picadão — Sistema de Delivery

> Plataforma full-stack de delivery para restaurante com storefront público, painel administrativo com RBAC, gateway de pagamentos, PWA e arquitetura de segurança em camadas.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Vitest](https://img.shields.io/badge/Testes-Vitest-6E9F18?logo=vitest)
![License](https://img.shields.io/badge/Licença-MIT-blue)

---

## Contexto do Projeto

Este projeto foi desenvolvido **com intenção comercial** para o restaurante **Rei do Picadão** (São José, SC). O sistema estava pronto para produção quando o dono decidiu não seguir com a plataforma digital. O código foi preservado como **projeto de estudo e portfólio**, mantendo a arquitetura completa que seria usada em produção — incluindo segurança, testes e pipeline de CI/CD.

A loja existe fisicamente e opera com delivery por telefone. Este sistema replicaria todo o fluxo digitalmente: cardápio online, cálculo de frete por distância real, pagamento via PIX/cartão, painel de gestão e notificações push para a equipe.

---

## Indice

- [Arquitetura](#arquitetura)
- [Seguranca](#seguranca)
- [PWA](#pwa)
- [Testes](#testes)
- [Pipeline de CI/CD e Qualidade](#pipeline-de-cicd-e-qualidade)
- [Tech Stack](#tech-stack)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Como Rodar](#como-rodar)
- [Scripts](#scripts)
- [Variaveis de Ambiente](#variaveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [API Routes](#api-routes)
- [Deploy](#deploy)

---

## Arquitetura

O projeto é um monolito Next.js 16 (App Router) que separa duas superfícies:

```
                         ┌─────────────────────────────────────┐
                         │           Next.js 16 (Turbopack)    │
                         │                                     │
  Cliente (browser) ───► │  (store)/       Storefront público  │
                         │    ├── page.tsx        Cardápio     │
                         │    ├── checkout/        3 etapas    │
                         │    └── confirmacao/    Rastreio     │
                         │                                     │
  Staff autenticado ───► │  (dashboard)/  Painel protegido     │
                         │    ├── dashboard/      Métricas     │
                         │    ├── pedidos/         Status      │
                         │    ├── produtos/          CRUD      │
                         │    ├── financeiro/      Despesas    │
                         │    └── configuracoes/    Loja       │
                         │                                     │
                         │  api/          Route Handlers       │
                         │    ├── checkout/   Frete/Asaas      │
                         │    ├── pedidos/     RBAC guard      │
                         │    ├── webhooks/  Clerk + Asaas     │
                         │    └── uploadthing/  Imagens        │
                         └──────────────┬──────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │  Neon (PG)   │   │    Clerk     │   │    Asaas     │
            │  Drizzle ORM │   │  Auth + JWT  │   │  Pagamentos  │
            └──────────────┘   └──────────────┘   └──────────────┘
                    │                                       │
                    ▼                                       ▼
            ┌──────────────┐                       ┌──────────────┐
            │    Upstash   │                       │ Google Maps  │
            │ Rate Limit   │                       │   Routes     │
            └──────────────┘                       └──────────────┘
```

### Fluxo de checkout (imune a adulteracao)

```
1. Cliente monta carrinho (browser)
2. GET /api/frete → geocoding + rota → cotação com TTL de 15 min (gravada no banco)
3. POST /api/checkout:
   ├── Validação CSRF (Origin/Referer)
   ├── Rate limit por IP + identidade (email+telefone)
   ├── Schema Zod .strict() → rejeita campos injetados (price, total, etc.)
   ├── Reconsulta catálogo no banco → recalcula subtotal
   ├── Revalida cotação (TTL + addressHash + não consumida)
   ├── Cria customer no Asaas
   ├── Transação atômica: marca cotação consumida + insere pedido + itens + adicionais
   ├── Cria pagamento no Asaas (valor = total calculado no servidor)
   ├── Gera token de rastreio (32 bytes, hash SHA-256, TTL 7 dias)
   └── Retorna checkout URL + tracking token
4. Cliente paga no Asaas → webhook atualiza status no banco
```

O cliente **nunca** envia preço, frete, ou status. Tudo é recalculado no servidor a partir do catálogo e da cotação persistida.

---

## Seguranca

O projeto passou por **duas rodadas de auditoria de segurança**. O relatório completo está em `auditoria-seguranca-round2.md`.

### RBAC centralizado (`src/lib/permissions.ts`)

```
┌──────────────┬────────────────────────────────────────────────────┐
│ Role         │ Permissões                                         │
├──────────────┼────────────────────────────────────────────────────┤
│ dono         │ TUDO (dashboard, financeiro, staff, produtos, etc)│
│ gerente      │ produtos, categorias, pedidos, cancelar pedidos    │
│ funcionario  │ ver pedidos, atualizar status                      │
│ cliente      │ nenhuma (apenas storefront público + rastreio)     │
└──────────────┴────────────────────────────────────────────────────┘
```

Toda rota e server action usa `can(role, action)` — um único ponto de auditoria. A role vem dos `sessionClaims` do Clerk JWT (nunca do client).

### Defesas implementadas

| Camada | Mecanismo | Arquivo |
|---|---|---|
| **IDOR/BOLA** | Token de rastreio de 32 bytes (hash SHA-256, TTL 7 dias). UUID do pedido nunca é autorização isolada. | `lib/order-tracking.ts`, `lib/order-access.ts` |
| **Adulteração de preço** | Schema Zod `.strict()`, recálculo server-side, cotação com TTL + addressHash + single-use | `lib/checkout.ts`, `api/checkout/route.ts` |
| **CSRF** | Validação de Origin/Referer em todos os POSTs públicos | `lib/origin-guard.ts` |
| **Rate limiting** | Upstash Redis distribuído (sliding window). Fail-closed (503) em produção sem Redis. | `lib/rate-limit.ts` |
| **Webhooks** | Clerk: Svix signature + body bruto + limite 1 MB. Asaas: token + `timingSafeEqual` + guarda de status no UPDATE | `api/webhooks/` |
| **CSP** | Nonce por requisição + `strict-dynamic`. Sem `unsafe-inline` em scripts. | `proxy.ts` |
| **Headers** | HSTS, X-Frame-Options: DENY, nosniff, Referrer-Policy, Permissions-Policy | `next.config.ts` |
| **Uploads** | MIME + extensão + magic bytes (JPEG/PNG/WebP). SVG rejeitado. Re-download pós-upload para verificar assinatura. | `api/uploadthing/core.ts` |
| **Privacidade** | Carrinho não persiste PII (CPF/telefone/endereço). `.env` com `chmod 600`. Logs redigidos (sem chaves nem PII). | `stores/cart-store.ts` |
| **Máquina de estados** | Transições explícitas com concorrência otimista (`WHERE status = currentStatus`) | `lib/order-status.ts` |

### Limites de rate limit

| Escopo | Limite | Janela |
|---|---|---|
| Checkout (IP) | 3 | 15 min |
| Checkout (identidade) | 3 | 15 min |
| Frete | 20 | 15 min |
| Status do pedido | 30 | 1 min |
| PIX QR Code | 30 | 1 min |
| Upload | 10 | 15 min |
| Push subscription | 10 | 15 min |

---

## PWA

O storefront é uma ** Progressive Web App** instalável:

| Recurso | Implementação |
|---|---|
| **Manifest** | `src/app/manifest.ts` — nome, ícones (72px a 512px + maskable), theme color, display standalone |
| **Service Worker** | `public/sw.js` — cache offline de assets estáticos |
| **Prompt de instalação** | `src/components/pwa/install-prompt.tsx` — banner customizado com dismiss persistente (max 3 rejeições) |
| **Push notifications** | Web Push (VAPID) para notificar a equipe quando um pedido é pago. `src/lib/web-push.ts` + `src/components/pwa/push-permission.tsx` |
| **Ícones** | 9 tamanhos em `public/icons/` incluindo maskable para Android adaptive icons |

---

## Testes

### Estrategia de testes

```
┌─────────────────────────────────────────────────────────────────┐
│                    Piramide de Testes                            │
│                                                                 │
│                    /\
│                   /  \        Playwright (E2E)                  │
│                  / E2E\       - Security headers                 │
│                 /______\      - CSP verification                 │
│                /        \     - CSRF rejection                   │
│               / Integration\   - costPrice leak detection        │
│              /______________\  - Dashboard redirect              │
│             /                \                                   │
│            /   Unit (Vitest)  \  - RBAC matrix (35 tests)       │
│           /____________________\ - Token crypto (12 tests)      │
│                                      - Checkout tamper (17)     │
│                                      - Origin guard (10)        │
└─────────────────────────────────────────────────────────────────┘
```

### Testes unitarios (Vitest) — 64 testes, 4 arquivos

| Arquivo | Tests | O que cobre |
|---|---|---|
| `lib/permissions.test.ts` | 35 | Matriz RBAC completa: cada role tem exatamente as permissões esperadas. Roles inválidos (`undefined`, `null`, `'admin'`, `'DONO'`) rejeitadas. `getRoleFromClaims()` extrai role do JWT Clerk com type safety. |
| `lib/order-tracking.test.ts` | 12 | Geração de token criptográfico (100 tokens únicos), validação timing-safe, rejeição de tokens expirados/errados/nulos. |
| `lib/checkout.test.ts` | 17 | Resistência a adulteração: injeção de `price`, `subtotal`, `total`, `deliveryFee` rejeitada. Limites de quantidade (max 20), items (max 20), validação de CPF/email/telefone, helpers monetários (`toCents`/`formatCents`), determinismo de hashes. |
| `lib/origin-guard.test.ts` | 10 | Proteção CSRF: aceita Origin correspondente, rejeita domínio/porta/protocolo diferentes, rejeita ataque de prefixo (`example.com.evil.com`), lida com Referer malformado. |

### Testes E2E (Playwright) — `e2e/security.spec.ts`

Rodam num browser Chromium real contra o app completo:

| Cenário | O que verifica |
|---|---|
| Security headers | `X-Frame-Options: DENY`, `nosniff`, CSP presente |
| CSP script-src | Contém `strict-dynamic`, sem `unsafe-inline` amplo |
| costPrice não vaza | `GET /api/produtos` não contém campo `costPrice` |
| Dashboard redireciona | Usuário anônimo não acessa `/dashboard` |
| CSRF no checkout | POST com `Origin: evil.com` retorna `403` |
| CSRF no frete | POST com `Origin: evil.com` retorna `403` |
| Preço adulterado | POST com `price: 0.01` injetado retorna `400` |

---

## Pipeline de CI/CD e Qualidade

```
GitHub Push/PR
    │
    ├── ci.yml
    │   ├── Lint (ESLint + eslint-plugin-security)
    │   ├── TypeCheck (tsc --noEmit)
    │   ├── Unit Tests (Vitest, 64 tests)
    │   ├── npm audit --omit=dev (0 vulnerabilities em prod)
    │   ├── E2E Tests (Playwright)
    │   └── Build (next build)
    │
    ├── security.yml
    │   ├── Gitleaks (scan de segredos no Git)
    │   └── npm audit (high/critical em prod)
    │
    ├── sonarcloud.yml
    │   ├── Coverage (vitest --coverage)
    │   └── SonarCloud Scan (análise estática)
    │
    ├── Dependabot (weekly)
    │   ├── npm: agrupado por ecossistema (Next, React, Clerk, DB)
    │   └── GitHub Actions
    │
    └── CodeRabbit (PR review contextual, via app GitHub)
```

| Ferramenta | Função | Arquivo de configuração |
|---|---|---|
| **Vitest** | Testes unitários e de integração | `vitest.config.ts` |
| **Playwright** | Testes E2E em browser real | `playwright.config.ts` |
| **ESLint + eslint-plugin-security** | Lint + detecção de padrões inseguros | `eslint.config.mjs` |
| **SonarCloud** | Análise estática, code smells, coverage | `sonar-project.properties` |
| **Gitleaks** | Detecção de segredos no histórico Git | `.github/workflows/security.yml` |
| **Dependabot** | Atualização automática de dependências | `.github/dependabot.yml` |
| **npm audit** | Vulnerabilidades em dependências de produção | CI gate |
| **CodeRabbit** | Revisão automatizada de Pull Requests | App GitHub (configuração na UI) |

---

## Tech Stack

### Core

| Tecnologia | Versão | Uso |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | Framework fullstack (App Router, Turbopack, Server Components, Server Actions) |
| [React](https://react.dev/) | 19.2 | UI com Server Components |
| [TypeScript](https://typescriptlang.org/) | 5 | Tipagem estática em todo o projeto |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Estilização utility-first (CSS-first config) |

### Backend e Dados

| Tecnologia | Uso |
|---|---|
| [Drizzle ORM](https://orm.drizzle.team/) 0.45 | ORM type-safe para PostgreSQL |
| [Neon Database](https://neon.tech/) | PostgreSQL serverless com branching |
| [Zod](https://zod.dev/) 4 | Validação de schemas (checkout, webhooks, uploads) |
| [Upstash Redis](https://upstash.com/) + [Ratelimit](https://github.com/upstash/ratelimit) | Rate limiting distribuído (sliding window) |

### Servicos integrados

| Tecnologia | Uso |
|---|---|
| [Clerk](https://clerk.com/) 7.6 | Autenticação, JWT, RBAC via `publicMetadata.role` |
| [Asaas](https://www.asaas.com/) | Gateway de pagamento (PIX, cartão) |
| [Google Maps Routes API](https://developers.google.com/maps/documentation/routes) | Cálculo de frete por distância real |
| [UploadThing](https://uploadthing.com/) 7.7 | Upload de imagens com validação |
| [Svix](https://svix.com/) | Verificação de assinatura de webhooks |
| [web-push](https://github.com/web-push-libs/web-push) | Notificações push (VAPID) |

### UI

| Tecnologia | Uso |
|---|---|
| [shadcn/ui](https://ui.shadcn.com/) + [Base UI](https://base-ui.com/) | Componentes de interface |
| [Lucide React](https://lucide.dev/) | Ícones |
| [React Hook Form](https://react-hook-form.com/) + [@hookform/resolvers](https://github.com/react-hook-form/resolvers) | Formulários com validação Zod |
| [Recharts](https://recharts.org/) | Gráficos do dashboard |
| [Sonner](https://sonner.emilkowal.dev/) | Notificações toast |
| [Zustand](https://zustand.docs.pmnd.rs/) 5 | State management (carrinho) |

### Testes e Qualidade

| Tecnologia | Uso |
|---|---|
| [Vitest](https://vitest.dev/) 4 | Testes unitários e de integração |
| [@playwright/test](https://playwright.dev/) 1.62 | Testes E2E |
| [eslint-plugin-security](https://github.com/eslint/eslint-plugin-security) | Detecção de padrões inseguros |
| [@vitest/coverage-v8](https://vitest.dev/guide/coverage) | Coverage para SonarCloud |

---

## Estrutura do Projeto

```
restaurante-rei-picadao/
├── src/
│   ├── app/
│   │   ├── (dashboard)/              # Painel admin (protegido por RBAC)
│   │   │   ├── dashboard/            #   Métricas e gráficos (dono)
│   │   │   ├── pedidos/              #   Gestão de pedidos + actions
│   │   │   ├── produtos/             #   CRUD + adicionais
│   │   │   ├── categorias/           #   CRUD de categorias
│   │   │   ├── financeiro/           #   Despesas (dono)
│   │   │   ├── funcionarios/         #   Equipe (dono)
│   │   │   ├── configuracoes/        #   Dados da loja (dono)
│   │   │   └── layout.tsx
│   │   ├── (store)/                  # Storefront público
│   │   │   ├── checkout/             #   3 etapas: endereco → pagamento → confirmacao
│   │   │   ├── storefront-client.tsx
│   │   │   └── page.tsx
│   │   ├── api/
│   │   │   ├── checkout/             #   POST: processa pedido + Asaas
│   │   │   ├── frete/                #   POST: cotação Google Maps
│   │   │   ├── pedidos/              #   GET/PATCH com RBAC guard
│   │   │   ├── orders/               #   check-status + pix-qrcode (token)
│   │   │   ├── produtos/             #   CRUD com DTO público
│   │   │   ├── despesas/             #   CRUD (dono only)
│   │   │   ├── funcionarios/         #   CRUD (manage_staff)
│   │   │   ├── push/                 #   Subscribe/unsubscribe
│   │   │   ├── uploadthing/          #   Upload com magic bytes
│   │   │   └── webhooks/             #   Clerk (Svix) + Asaas (token)
│   │   ├── manifest.ts               #   PWA manifest
│   │   └── layout.tsx
│   ├── components/
│   │   ├── pwa/                      #   install-prompt, push-permission, register-sw
│   │   ├── store/                    #   Componentes da loja
│   │   └── ui/                       #   shadcn/ui
│   ├── lib/
│   │   ├── permissions.ts            #   RBAC: can(role, action) + getRoleFromClaims
│   │   ├── checkout.ts               #   Schemas Zod + helpers monetários + hashes
│   │   ├── order-status.ts           #   Máquina de estados + concorrência otimista
│   │   ├── order-tracking.ts         #   Token de rastreio (crypto + timingSafeEqual)
│   │   ├── order-access.ts           #   getTrackableOrder (valida token)
│   │   ├── origin-guard.ts           #   CSRF: valida Origin/Referer
│   │   ├── rate-limit.ts             #   Upstash Redis + fallback dev
│   │   ├── asaas.ts                  #   Customer, checkout, refund, delete
│   │   ├── google-maps.ts            #   Geocoding + Routes API
│   │   ├── public-catalog.ts         #   DTO: exclui costPrice do público
│   │   ├── web-push.ts               #   VAPID push notifications
│   │   └── uploadthing.ts
│   ├── stores/
│   │   └── cart-store.ts             #   Zustand (partialize: só items, sem PII)
│   ├── db/
│   │   ├── schema.ts                 #   15 tabelas (Drizzle)
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── proxy.ts                      #   Clerk middleware + RBAC + CSP nonce
│   └── *.test.ts                     #   Testes unitários (4 arquivos)
├── e2e/
│   └── security.spec.ts              #   Playwright E2E
├── drizzle/                          #   Migrações SQL
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    #   Lint + typecheck + test + build
│   │   ├── security.yml              #   Gitleaks + npm audit
│   │   └── sonarcloud.yml            #   SonarCloud analysis
│   └── dependabot.yml
├── vitest.config.ts
├── playwright.config.ts
├── sonar-project.properties
├── eslint.config.mjs                 #   ESLint + eslint-plugin-security
├── next.config.ts                    #   Security headers
├── drizzle.config.ts
└── package.json
```

---

## Como Rodar

### Pre-requisitos

| Ferramenta | Versão |
|---|---|
| [Node.js](https://nodejs.org/) | 20+ |
| [npm](https://wwwnpmjs.com/) | 10+ |

### Passo a passo

```bash
# 1. Clone
git clone https://github.com/AbilioGamaNetoJ/restaurante-rei-picadao.git
cd restaurante-rei-picadao

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas chaves (Clerk, Neon, Asaas, Google Maps, etc.)
chmod 600 .env

# 4. Sincronize o banco
npx drizzle-kit push

# 5. (Opcional) Popule com dados iniciais
npx tsx src/db/seed.ts

# 6. Rode o projeto
npm run dev
```

Acesse:

| Area | URL |
|---|---|
| Loja | http://localhost:3000 |
| Dashboard | http://localhost:3000/dashboard |
| Login | http://localhost:3000/sign-in |

---

## Scripts

### Desenvolvimento

| Comando | Descricao |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento (Turbopack) |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | ESLint + eslint-plugin-security |

### Testes

| Comando | Descricao |
|---|---|
| `npm run test` | Roda todos os testes unitários (Vitest, 64 tests) |
| `npm run test:watch` | Vitest em modo watch (re-roda ao salvar arquivo) |
| `npm run test:e2e` | Roda testes E2E do Playwright (auto-inicia dev server) |
| `npm run test:e2e:ui` | Playwright em modo interativo com UI |

### Qualidade e Seguranca

| Comando | Descricao |
|---|---|
| `npm run typecheck` | `tsc --noEmit` — verifica tipos sem gerar output |
| `npm run audit:prod` | `npm audit --omit=dev` — vulnerabilidades em produção |
| `npm run security:scan` | typecheck + lint + test + audit (tudo de uma vez) |

### Banco de dados

| Comando | Descricao |
|---|---|
| `npx drizzle-kit push` | Sincroniza schema com o banco (dev) |
| `npx drizzle-kit migrate` | Aplica migrações (produção) |
| `npx drizzle-kit generate` | Gera nova migration SQL |
| `npx drizzle-kit studio` | Abre o Drizzle Studio (visualizador) |

---

## Variaveis de Ambiente

Crie um arquivo `.env` na raiz (use `.env.example` como template):

```env
# Clerk (Autenticacao)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Neon (PostgreSQL)
DATABASE_URL=postgresql://...

# Asaas (Pagamentos)
ASAAS_API_KEY=...
ASAAS_WEBHOOK_TOKEN=...
ASAAS_API_URL=https://sandbox.asaas.com/api/v3

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# UploadThing
UPLOADTHING_TOKEN=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Upstash Redis (rate limit distribuído — obrigatório em produção)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Web Push (opcional, notificações para equipe)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contato@seudominio.com
```

> Sem Upstash Redis, checkout, frete, rastreio, PIX e upload **falham fechados** (503) em produção — comportamento intencional de segurança. Em desenvolvimento, usa rate limit em memória.

---

## Banco de Dados

Drizzle ORM com Neon PostgreSQL. 15 tabelas:

```
categories ──< products ──< addons
                  │
                  └──< order_items ──< order_item_addons
                          │
orders (tracking_token_hash, consumed_at delivery_quotes)
  │
  ├── store_settings ──< store_hours
  ├── expenses
  ├── users (clerk_id, role, salary)
  ├── push_subscriptions (endpoint, p256dh, auth)
  └── saved_addresses
```

### Modelos principais

| Tabela | Campos de seguranca |
|---|---|
| `orders` | `trackingTokenHash` (SHA-256), `trackingTokenExpiresAt`, `status` (máquina de estados) |
| `delivery_quotes` | `addressHash`, `expiresAt` (15 min), `consumedAt` (single-use) |
| `products` | `costPrice` (nunca exposto publicamente via `publicProductColumns`) |

---

## API Routes

### Publicas (loja)

| Metodo | Rota | Protecao | Descricao |
|---|---|---|---|
| `GET` | `/api/produtos` | DTO sem costPrice | Lista produtos (força isAvailable para não-staff) |
| `GET` | `/api/produtos/[id]` | DTO sem costPrice | Detalhe de produto |
| `GET` | `/api/categorias` | — | Lista categorias ativas |
| `POST` | `/api/frete` | CSRF + rate limit 20/15min | Cotação de frete (Google Maps) |
| `POST` | `/api/checkout` | CSRF + rate limit 3/15min + schema strict | Processa pedido + Asaas |
| `GET` | `/api/orders/check-status` | Token + rate limit 30/min | Status do pedido via tracking token |
| `GET` | `/api/orders/pix-qrcode` | Token + rate limit 30/min | QR Code PIX via tracking token |

### Protegidas (staff)

| Metodo | Rota | Permissao |
|---|---|---|
| `GET` | `/api/pedidos` | `view_orders` |
| `PATCH` | `/api/pedidos/[id]` | `manage_orders` (+ state machine) |
| `POST` | `/api/produtos` | `manage_products` |
| `PUT/DELETE` | `/api/produtos/[id]` | `manage_products` |
| `POST` | `/api/categorias` | `manage_categories` |
| `GET` | `/api/despesas` | `view_finance` |
| `POST/PUT/DELETE` | `/api/despesas` | `manage_finance` |
| `GET/POST` | `/api/funcionarios` | `manage_staff` |

### Webhooks

| Metodo | Rota | Validacao |
|---|---|---|
| `POST` | `/api/webhooks/clerk` | Svix signature + body bruto + limite 1 MB |
| `POST` | `/api/webhooks/asaas` | Token + timingSafeEqual + Zod + guarda de status |

---

## Deploy

### Vercel (recomendado)

1. Conecte o repositório à [Vercel](https://vercel.com/)
2. Configure todas as variáveis de ambiente no painel
3. Deploy automático a cada push na `main`

**Pre-flight antes de produção:**

```bash
npm run security:scan   # typecheck + lint + test + audit
npm run build           # build de produção
```

### Checklist de producao

- [ ] `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` configurados
- [ ] `ASAAS_API_URL` aponta para produção (não sandbox)
- [ ] `NEXT_PUBLIC_APP_URL` usa HTTPS real
- [ ] `ENABLE_WEBHOOK_BYPASS` **não** definido (bypass de teste desativado)
- [ ] `.env` com `chmod 600`
- [ ] Migration `consumed_at` aplicada (`npx drizzle-kit migrate`)
- [ ] Clerk: verificação de e-mail e MFA para equipe ativados
- [ ] `npm audit --omit=dev` sem alta/crítica

---

## Referencias

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Clerk Docs](https://clerk.com/docs)
- [Asaas API](https://docs.asaas.com/)
- [Google Maps Routes API](https://developers.google.com/maps/documentation/routes)
- [UploadThing](https://docs.uploadthing.com/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/docs/intro)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/docs)

---

<div align="center">

Projeto desenvolvido como portfólio técnico. Arquitetura completa de produção com segurança, testes e CI/CD.

</div>
