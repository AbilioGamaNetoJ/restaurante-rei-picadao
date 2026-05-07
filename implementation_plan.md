# Rei do Picadão — Loja de Delivery + Dashboard Administrativo

## Visão Geral

Aplicação full-stack de delivery para o **Rei do Picadão - Porções** (Canasvieiras, Florianópolis).

1. **Loja (Storefront)** — Catálogo, detalhes com adicionais, carrinho persistente, validação de entrega (máx. 10km), checkout com redirect Asaas.
2. **Dashboard Administrativo** — Pedidos, produtos, métricas e funcionários com 3 níveis de acesso.

---

## Decisões Confirmadas

| Decisão | Resposta |
|---|---|
| **Asaas Checkout** | Redirect (não embutido) |
| **Tailwind + shadcn** | Versões mais recentes (Tailwind v4 + `shadcn@latest`) |
| **Frete** | R$1,50/km via Google Routes API (ComputeRouteMatrix) |
| **Pedido mínimo** | R$45,00 |
| **Horário** | Multi-turno por dia (ver tabela abaixo). Fora do horário: popup de aviso, carrinho persiste em `localStorage` |
| **Endereço da loja** | Rua José Daux, 5314 – Canasvieiras, Florianópolis – SC, CEP 88054-250 |
| **Dados iniciais** | Seed com categorias + config loja. Produtos cadastrados via dashboard |
| **Upload de imagens** | UploadThing (2GB grátis, CDN, SDK Next.js) |

### Horário de Funcionamento

| Dia | Turno 1 | Turno 2 |
|---|---|---|
| Segunda | 00:00 – 01:30 | 17:30 – 23:59 |
| Terça | — | 17:30 – 23:59 |
| Quarta | — | 17:30 – 23:59 |
| Quinta | — | 17:30 – 23:59 |
| Sexta | 11:00 – 23:59 | — |
| Sábado | 00:00 – 03:00 | 17:30 – 23:59 |
| Domingo | 00:00 – 03:00 | 17:30 – 23:59 |

> [!NOTE]
> **Turnos noturnos**: Os horários 00:00–01:30 (segunda) e 00:00–03:00 (sábado/domingo) são continuações da noite anterior. A lógica de verificação de horário tratará isso comparando dia + hora atual contra todos os slots definidos.

> [!IMPORTANT]
> **Chaves de API necessárias** (você adicionará no `.env`):
> - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY`
> - `DATABASE_URL` (Neon — projeto `Pagina-Vendas-Restaurante` já existe)
> - `ASAAS_API_KEY` (sandbox)
> - `GOOGLE_MAPS_API_KEY` (habilitar **Routes API** + **Geocoding API** no [Cloud Console](https://console.cloud.google.com/apis/library))
> - `UPLOADTHING_TOKEN`
>
> **⚠️ Nota sobre Google Maps:** A Distance Matrix API foi movida para status **Legacy** (março 2025) e não está mais disponível para novos projetos. Usaremos:
> - **Routes API** (`routes.googleapis.com`) — método `ComputeRouteMatrix` para calcular distância restaurante↔cliente
> - **Geocoding API** (`geocoding-backend.googleapis.com`) — converter endereço digitado em coordenadas lat/lng (v4 GA desde março 2026)

---

## Categorias do Cardápio

Baseado no iFood + categorias de adicionais:

| # | Categoria | Tipo |
|---|---|---|
| 1 | Destaques | Produto |
| 2 | Ofertas do Rei | Produto |
| 3 | Frango Frito Normal | Produto |
| 4 | Frango Frito Especial | Produto |
| 5 | Frango Frito Super Especial | Produto |
| 6 | Picanha do Rei Normal | Produto |
| 7 | Picanha do Rei Especial | Produto |
| 8 | Camarão do Rei Normal | Produto |
| 9 | Camarão do Rei Especial | Produto |
| 10 | Camarão do Rei Super Especial | Produto |
| 11 | Isca de Peixe do Rei | Produto |
| 12 | Camarão com Isca de Peixe do Rei | Produto |
| 13 | Picados | Produto |
| 14 | Mega Do Rei | Produto |
| 15 | Porções Individuais | Produto |
| 16 | Porções | Produto |
| 17 | Bebidas | Adicional |
| 18 | Molhos | Adicional |

A loja terá uma **barra de pesquisa** que permite buscar produtos por nome.

---

## Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| UI | shadcn/ui (latest) + Tailwind CSS v4 |
| Autenticação | Clerk (`publicMetadata` para roles) |
| Banco de dados | Neon PostgreSQL 17 (serverless, `sa-east-1`) |
| ORM | Drizzle ORM |
| Pagamentos | Asaas Checkout (redirect) |
| Frete | Google Routes API — `ComputeRouteMatrix` (R$1,50/km) + Geocoding API |
| Upload | UploadThing |
| Estado local | Zustand (carrinho com persistência `localStorage`) |
| Deploy | Vercel (recomendado) |

---

## Proposed Changes

### Fase 1 — Inicialização do Projeto

#### [NEW] Projeto Next.js 15

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Dependências:
```bash
npm install drizzle-orm @neondatabase/serverless @clerk/nextjs @uploadthing/react uploadthing @googlemaps/routing zod react-hook-form @hookform/resolvers lucide-react zustand sonner
npm install -D drizzle-kit
npx -y shadcn@latest init
```

#### [NEW] Estrutura de diretórios

```
src/
├── app/
│   ├── (store)/                    # Loja pública
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Catálogo + busca + filtro categorias
│   │   ├── carrinho/page.tsx
│   │   └── checkout/
│   │       ├── endereco/page.tsx
│   │       ├── pagamento/page.tsx
│   │       └── confirmacao/page.tsx
│   ├── (dashboard)/                # Admin (auth required)
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx      # Métricas (Dono)
│   │   ├── pedidos/page.tsx        # Fila de pedidos (todos)
│   │   ├── produtos/page.tsx       # CRUD produtos (Dono+Gerente)
│   │   ├── categorias/page.tsx     # CRUD categorias (Dono+Gerente)
│   │   ├── funcionarios/page.tsx   # Gestão (Dono+Gerente)
│   │   ├── financeiro/page.tsx     # Custos (Dono)
│   │   └── configuracoes/page.tsx  # Config loja (Dono)
│   ├── api/
│   │   ├── webhooks/{clerk,asaas}/route.ts
│   │   ├── pedidos/[...]/route.ts
│   │   ├── produtos/[...]/route.ts
│   │   ├── categorias/route.ts
│   │   ├── checkout/route.ts
│   │   ├── frete/route.ts
│   │   ├── despesas/route.ts
│   │   ├── funcionarios/route.ts
│   │   └── uploadthing/route.ts
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn
│   ├── store/                      # product-card, product-detail-modal, cart-sheet,
│   │                               # search-bar, category-filter, address-form,
│   │                               # closed-store-dialog
│   ├── dashboard/                  # sidebar, order-card, product-form,
│   │                               # metrics-cards, revenue-chart
│   └── shared/                     # header, footer, loading
├── db/
│   ├── index.ts                    # Conexão Neon + Drizzle
│   ├── schema.ts                   # Tabelas
│   └── seed.ts                     # Seed de categorias, loja e horários
├── lib/
│   ├── utils.ts
│   ├── asaas.ts                    # Client Asaas
│   ├── google-maps.ts              # Routes API (ComputeRouteMatrix) + Geocoding API
│   ├── uploadthing.ts              # Config UploadThing
│   └── validators.ts               # Zod schemas
├── stores/
│   └── cart-store.ts               # Zustand + localStorage persist
├── types/index.ts
└── proxy.ts                         # Clerk + RBAC
```

---

### Fase 2 — Schema do Banco de Dados (Drizzle + Neon)

#### [NEW] `src/db/schema.ts`

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   categories    │     │    products       │     │  product_addons  │
├─────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (uuid PK)    │◄────│ category_id (FK) │     │ id (uuid PK)     │
│ name            │     │ id (uuid PK)     │◄────│ product_id (FK)  │
│ slug            │     │ name             │     │ addon_id (FK)────│──►addons
│ type (produto/  │     │ description      │     └──────────────────┘
│       adicional)│     │ price            │
│ sort_order      │     │ cost_price       │     ┌──────────────────┐
│ is_active       │     │ image_url        │     │     addons       │
│ created_at      │     │ is_available     │     ├──────────────────┤
│ updated_at      │     │ sort_order       │     │ id (uuid PK)     │
└─────────────────┘     │ created_at       │     │ name             │
                        │ updated_at       │     │ price            │
                        └──────────────────┘     │ category (enum:  │
                                                 │  bebida/molho)   │
                                                 │ image_url        │
                                                 │ is_available     │
                                                 └──────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    orders       │     │   order_items    │     │ order_item_addons│
├─────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (uuid PK)    │◄────│ order_id (FK)    │◄────│ order_item_id FK │
│ customer_name   │     │ id (uuid PK)     │     │ addon_id (FK)    │
│ customer_email  │     │ product_id (FK)  │     │ addon_name       │
│ customer_phone  │     │ product_name     │     │ addon_price      │
│ address_*       │     │ product_price    │     │ quantity         │
│ distance_km     │     │ quantity         │     └──────────────────┘
│ delivery_fee    │     │ comment (140chr) │
│ subtotal        │     │ subtotal         │     ┌──────────────────┐
│ total           │     └──────────────────┘     │ store_settings   │
│ status (enum)   │                              ├──────────────────┤
│ payment_id      │     ┌──────────────────┐     │ id (uuid PK)     │
│ payment_method  │     │    expenses      │     │ name             │
│ payment_status  │     ├──────────────────┤     │ address          │
│ asaas_checkout  │     │ id (uuid PK)     │     │ lat/lng          │
│ created_at      │     │ description      │     │ delivery_radius  │
│ updated_at      │     │ amount           │     │  (default: 10)   │
└─────────────────┘     │ category         │     │ min_order (45.00)│
                        │ created_by       │     │ delivery_fee_km  │
┌──────────────────┐    │ created_at       │     │  (default: 1.50) │
│ saved_addresses  │    └──────────────────┘     │ phone/whatsapp   │
├──────────────────┤                             └──────────────────┘
│ id (uuid PK)     │
│ customer_email   │     ┌──────────────────┐
│ label            │     │  store_hours     │
│ address/city/    │     ├──────────────────┤
│  state/zip       │     │ id (uuid PK)     │
│ lat/lng          │     │ store_id (FK)    │
│ created_at       │     │ day_of_week (0-6)│
└──────────────────┘     │ open_time (TIME) │
                         │ close_time (TIME)│
                         └──────────────────┘
```

> [!NOTE]
> A tabela `store_hours` suporta **múltiplos turnos por dia** (ex: segunda tem 00:00–01:30 e 17:30–23:59 como 2 registros). `day_of_week`: 0=domingo, 1=segunda, ..., 6=sábado.

**Status do pedido:** `pending` → `paid` → `preparing` → `ready` → `delivering` → `delivered` | `cancelled`

#### [NEW] `src/db/seed.ts`
Seed com:
- 18 categorias definidas
- Configurações da loja (endereço, raio 10km, frete R$1,50/km, pedido mínimo R$45)
- **11 registros de `store_hours`** com os horários multi-turno de cada dia da semana

---

### Fase 3 — Autenticação e RBAC (Clerk)

#### [NEW] `src/proxy.ts`

Proxy (antigo Middleware) Clerk com `createRouteMatcher`:
- `/dashboard/*` → exige auth
- `/dashboard/dashboard`, `/dashboard/financeiro`, `/dashboard/configuracoes` → `role === 'dono'`
- `/dashboard/produtos`, `/dashboard/categorias`, `/dashboard/funcionarios` → `role === 'dono'` ou `role === 'gerente'`
- Loja → pública

**Roles via `publicMetadata`:** `{ "role": "dono" | "gerente" | "funcionario" }`

| Funcionalidade | Dono | Gerente | Funcionário |
|---|:---:|:---:|:---:|
| Dashboard (métricas) | ✅ | ❌ | ❌ |
| Financeiro (custos) | ✅ | ❌ | ❌ |
| Configurações | ✅ | ❌ | ❌ |
| Histórico de pedidos | ✅ | ✅ | ❌ |
| Fila de pedidos | ✅ | ✅ | ✅ |
| Gerenciar produtos | ✅ | ✅ | ❌ |
| Gerenciar categorias | ✅ | ✅ | ❌ |
| Cadastrar `dono`/`gerente` | ✅ | ❌ | ❌ |
| Cadastrar `funcionario` | ✅ | ✅ | ❌ |

---

### Fase 4 — Loja (Storefront)

#### [NEW] `src/app/(store)/page.tsx`
- Hero section com banner
- **Barra de pesquisa** por nome de produto (busca client-side com debounce)
- Filtro horizontal scrollable por categorias (18 categorias)
- Grid de product cards
- Badge "Fechado" se fora do horário (17:30–00:00)
- Indicador pedido mínimo R$45

#### [NEW] `src/components/store/closed-store-dialog.tsx`
**Dialog/popup** que aparece ao tentar finalizar pedido fora do horário:
> "Infelizmente estamos fora do horário de atendimento. Confira nossos horários de funcionamento. Seus itens continuam salvos na sacola!"

O dialog mostra a **tabela completa de horários por dia da semana** e o carrinho **persiste em `localStorage`** mesmo após recarregar.

#### [NEW] `src/components/store/product-detail-modal.tsx`
Modal ao clicar no card:
- Foto, nome, descrição, preço
- **Adicionais**: bebidas (checkbox + quantidade) e molhos extras (se aplicável ao produto)
- Comentário (max 140 chars com contador)
- Seletor quantidade (−/+)
- Botão "Adicionar ao carrinho" com preço total

#### [NEW] `src/stores/cart-store.ts`
Zustand com middleware `persist` (localStorage):
- `items[]`, `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`
- Cálculo automático de subtotal
- **Dados persistem entre reloads e fora do horário**

#### [NEW] `src/app/(store)/carrinho/page.tsx`
- Lista de itens com foto, nome, addons, comentário, qtd, preço
- Editar quantidade / remover
- Subtotal + validação pedido mínimo R$45
- Botão "Continuar" (bloqueado se < R$45 ou fora do horário com popup)

---

### Fase 5 — Checkout (Endereço + Frete + Pagamento)

#### [NEW] `src/app/(store)/checkout/endereco/page.tsx`
- Auto-preenchimento via ViaCEP (por CEP)
- Endereços salvos (localStorage por email do cliente)
- Checkbox "Salvar para futuras compras"
- Ao confirmar → chama `/api/frete`

#### [NEW] `src/app/api/frete/route.ts`
1. Geocodifica endereço do cliente (Google Geocoding API v4)
2. Calcula distância via Routes API `ComputeRouteMatrix` (origem: Rua José Daux, 5314, Canasvieiras)
3. Se > 10km → `"Desculpe, mas não realizamos pedidos em endereços com mais de 10km de distância da loja"`
4. Se OK → `frete = distância_km × R$1,50`

#### [NEW] `src/app/(store)/checkout/pagamento/page.tsx`
Resumo: itens + endereço + subtotal + frete = total → botão "Pagar" → redirect Asaas

#### [NEW] `src/app/api/checkout/route.ts`
1. Cria `order` no banco (status `pending`)
2. Cria checkout Asaas (Pix + cartão) com callback URL
3. Retorna URL para redirect

#### [NEW] `src/app/api/webhooks/asaas/route.ts`
Recebe `CHECKOUT_PAID` / `CHECKOUT_CANCELED` → atualiza status do pedido

#### [NEW] `src/app/(store)/checkout/confirmacao/page.tsx`
Confirmação pós-pagamento com número do pedido

---

### Fase 6 — Dashboard Administrativo

#### [NEW] `src/app/(dashboard)/layout.tsx`
Sidebar com menu baseado no role + indicador de pedidos novos

#### [NEW] `src/app/(dashboard)/dashboard/page.tsx` *(Dono)*
Cards: faturamento dia/mês, pedidos, ticket médio, cancelamentos. Gráfico de faturamento.

#### [NEW] `src/app/(dashboard)/pedidos/page.tsx` *(Todos)*
Fila com tabs por status. Cards com: nº, cliente, itens, endereço, valor, horário, comentários. Botões para avançar status.

#### [NEW] `src/app/(dashboard)/produtos/page.tsx` *(Dono+Gerente)*
CRUD com tabela, upload de foto via UploadThing, vinculação de adicionais por produto.

#### [NEW] `src/app/(dashboard)/categorias/page.tsx` *(Dono+Gerente)*
CRUD de categorias com reordenação.

#### [NEW] `src/app/(dashboard)/funcionarios/page.tsx` *(Dono+Gerente)*
Gestão via Clerk API. Dono cria qualquer role; Gerente só `funcionario`.

#### [NEW] `src/app/(dashboard)/financeiro/page.tsx` *(Dono)*
Despesas + resumo custos × receita + relatórios por período.

#### [NEW] `src/app/(dashboard)/configuracoes/page.tsx` *(Dono)*
Endereço, raio de entrega, **horários por dia da semana** (CRUD de turnos), pedido mínimo, valor frete/km, contato.

---

### Fase 7 — API Routes

| Endpoint | Métodos | Auth |
|---|---|---|
| `/api/produtos` | GET (público), POST | Dono/Gerente |
| `/api/produtos/[id]` | GET, PUT, DELETE | Dono/Gerente |
| `/api/pedidos` | GET, POST | POST público, GET auth |
| `/api/pedidos/[id]` | GET, PATCH | Auth |
| `/api/categorias` | GET (público), POST, PUT, DELETE | Dono/Gerente |
| `/api/checkout` | POST | Público |
| `/api/frete` | POST | Público |
| `/api/despesas` | GET, POST, PUT, DELETE | Dono |
| `/api/funcionarios` | GET, POST, DELETE | Dono/Gerente |
| `/api/uploadthing` | POST | Dono/Gerente |
| `/api/webhooks/asaas` | POST | Asaas (secret) |
| `/api/webhooks/clerk` | POST | Clerk (secret) |

---

### Fase 8 — Integrações Externas

#### [NEW] `src/lib/asaas.ts`
- `createCheckout(order)` → URL de redirect
- Webhook `CHECKOUT_PAID` / `CHECKOUT_CANCELED`

#### [NEW] `src/lib/google-maps.ts`
- `geocodeAddress(address)` → `{ lat, lng }` (via Geocoding API v4)
- `calculateDistance(origin, destination)` → `{ distance_km, duration_min }` (via Routes API `ComputeRouteMatrix`)
- `calculateDeliveryFee(distance_km)` → `distance_km × 1.50`

> [!NOTE]
> Usamos `@googlemaps/routing` (SDK oficial da Routes API) em vez do pacote legado `@googlemaps/google-maps-services-js`. A Distance Matrix API foi descontinuada para novos projetos desde março 2025.

#### [NEW] `src/lib/uploadthing.ts`
- FileRouter para upload de imagens de produtos (max 4MB, image/*)
- Componente `<UploadButton>` no formulário de produto

---

## Verification Plan

### Automated
1. `npx drizzle-kit push` — schema válido no Neon
2. `npm run build` — TypeScript + Next.js sem erros
3. Testar endpoints via browser DevTools
4. Checkout sandbox Asaas

### Manual
1. **Loja**: catálogo → busca → produto → addons → carrinho → checkout → pagamento
2. **Fora do horário**: popup aparece, carrinho persiste
3. **Endereço > 10km**: mensagem de erro
4. **Dashboard**: login com 3 roles diferentes, verificar permissões
5. **Webhook**: simular pagamento Asaas → status atualiza
