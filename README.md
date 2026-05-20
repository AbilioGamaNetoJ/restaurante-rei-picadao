# 🍖 Rei do Picadão — Sistema de Delivery

> **A melhor porção da cidade!** Sistema completo de delivery online com storefront, painel administrativo e integração com pagamentos.

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-C5F74F?logo=drizzle)
![License](https://img.shields.io/badge/Licença-Privado-red)

---

## 📋 Índice

- [🍖 Rei do Picadão — Sistema de Delivery](#-rei-do-picadão--sistema-de-delivery)
  - [📋 Índice](#-índice)
  - [🎯 Sobre o Projeto](#-sobre-o-projeto)
  - [✨ Funcionalidades](#-funcionalidades)
  - [🛠️ Tech Stack](#️-tech-stack)
  - [📁 Estrutura do Projeto](#-estrutura-do-projeto)
  - [⚡ Pré-requisitos](#-pré-requisitos)
  - [🚀 Como Rodar](#-como-rodar)
  - [🔑 Variáveis de Ambiente](#-variáveis-de-ambiente)
  - [🗄️ Banco de Dados](#️-banco-de-dados)
  - [📡 API Routes](#-api-routes)
  - [🧩 Principais Componentes](#-principais-componentes)
  - [🌐 Deploy](#-deploy)
  - [📚 Referências](#-referências)

---

## 🎯 Sobre o Projeto

O **Rei do Picadão** é um sistema web completo de delivery para restaurante, construído com **Next.js 16** e **React 19**. O projeto possui duas áreas principais:

1. **🛒 Storefront (Loja)** — Interface pública onde clientes visualizam o cardápio, montam pedidos com adicionais, calculam frete por distância e finalizam a compra via gateway de pagamento.
2. **📊 Dashboard Administrativo** — Painel protegido por autenticação onde o dono/gerente gerencia produtos, categorias, pedidos, funcionários, despesas e configurações da loja.

### 💡 Diferenciais

- Cálculo de frete inteligente usando **Google Maps Routes API** (distância real, não raio)
- Pagamento integrado com **Asaas** (PIX, cartão, boleto)
- Upload de imagens via **UploadThing**
- Autenticação robusta com **Clerk** (webhook sync para banco local)
- Sistema de permissões por role (`admin`, `funcionario`, `cliente`)
- Horários de funcionamento configuráveis por dia da semana

---

## ✨ Funcionalidades

### 🛒 Loja (Cliente)

| Funcionalidade | Descrição |
|---|---|
| 📜 Cardápio dinâmico | Produtos organizados por categorias com imagens e preços |
| ➕ Adicionais | Sistema de add-ons por produto (ex: bacon extra, queijo) |
| 🛍️ Carrinho | Carrinho persistente com Zustand (state management) |
| 📍 Cálculo de frete | Frete baseado em distância real via Google Maps |
| 💳 Checkout | Pagamento via Asaas com múltiplos métodos |
| 📦 Acompanhamento | Status do pedido em tempo real |

### 📊 Dashboard (Admin)

| Funcionalidade | Descrição |
|---|---|
| 📦 Produtos | CRUD completo com upload de imagem e categorização |
| 🏷️ Categorias | Gerenciamento de categorias (produto e adicional) |
| 📋 Pedidos | Visualização e atualização de status dos pedidos |
| 👥 Funcionários | Cadastro e gerenciamento de equipe |
| 💰 Financeiro | Registro e controle de despesas |
| ⚙️ Configurações | Dados da loja, horários, raio de entrega, taxa/km |

---

## 🛠️ Tech Stack

### 🏗️ Core

| Tecnologia | Versão | Uso |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16.2 | Framework fullstack (App Router + Turbopack) |
| [React](https://react.dev/) | 19 | Biblioteca de UI |
| [TypeScript](https://typescriptlang.org/) | 5 | Tipagem estática |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Estilização utility-first |

### 🗄️ Dados & Backend

| Tecnologia | Uso |
|---|---|
| [Drizzle ORM](https://orm.drizzle.team/) | ORM type-safe para PostgreSQL |
| [Neon Database](https://neon.tech/) | PostgreSQL serverless |
| [Zustand](https://zustand.docs.pmnd.rs/) | State management (carrinho) |
| [Zod](https://zod.dev/) | Validação de schemas |

### 🔐 Autenticação & Serviços

| Tecnologia | Uso |
|---|---|
| [Clerk](https://clerk.com/) | Autenticação e gerenciamento de usuários |
| [Asaas](https://www.asaas.com/) | Gateway de pagamento (PIX, cartão, boleto) |
| [Google Maps API](https://developers.google.com/maps) | Cálculo de frete por distância |
| [UploadThing](https://uploadthing.com/) | Upload de imagens |

### 🧰 UI & Ferramentas

| Tecnologia | Uso |
|---|---|
| [shadcn/ui](https://ui.shadcn.com/) | Componentes de interface |
| [Lucide React](https://lucide.dev/) | Ícones |
| [React Hook Form](https://react-hook-form.com/) | Formulários |
| [Sonner](https://sonner.emilkowal.dev/) | Notificações toast |

---

## 📁 Estrutura do Projeto

```
restaurante-rei-picadao/
├── 📂 src/
│   ├── 📂 app/                       # App Router (Next.js)
│   │   ├── 📂 (dashboard)/           # 📊 Rotas do painel admin
│   │   │   ├── 📂 categorias/        #   Gerenciar categorias
│   │   │   ├── 📂 configuracoes/     #   Configurações da loja
│   │   │   ├── 📂 dashboard/         #   Página principal do admin
│   │   │   ├── 📂 financeiro/        #   Controle financeiro
│   │   │   ├── 📂 funcionarios/      #   Gerenciar funcionários
│   │   │   ├── 📂 pedidos/           #   Gerenciar pedidos
│   │   │   ├── 📂 produtos/          #   Gerenciar produtos
│   │   │   └── layout.tsx            #   Layout do dashboard
│   │   ├── 📂 (store)/               # 🛒 Rotas da loja pública
│   │   │   ├── 📂 checkout/          #   Fluxo de checkout
│   │   │   ├── storefront-client.tsx  #   Componente principal da loja
│   │   │   ├── page.tsx              #   Página inicial
│   │   │   └── layout.tsx            #   Layout da loja
│   │   ├── 📂 api/                   # 🔌 API Routes
│   │   │   ├── 📂 categorias/        #   CRUD categorias
│   │   │   ├── 📂 checkout/          #   Processamento de pagamento
│   │   │   ├── 📂 despesas/          #   CRUD despesas
│   │   │   ├── 📂 frete/             #   Cálculo de frete
│   │   │   ├── 📂 funcionarios/      #   CRUD funcionários
│   │   │   ├── 📂 pedidos/           #   CRUD pedidos
│   │   │   ├── 📂 produtos/          #   CRUD produtos
│   │   │   ├── 📂 uploadthing/       #   Upload de arquivos
│   │   │   └── 📂 webhooks/          #   Webhooks (Clerk, Asaas)
│   │   ├── 📂 sign-in/               # 🔐 Página de login
│   │   ├── 📂 sign-up/               # 🔐 Página de cadastro
│   │   ├── globals.css               #   Estilos globais
│   │   └── layout.tsx                #   Layout raiz
│   ├── 📂 components/                # 🧩 Componentes reutilizáveis
│   │   ├── 📂 store/                 #   Componentes da loja
│   │   ├── 📂 ui/                    #   shadcn/ui components
│   │   └── logout-button.tsx         #   Botão de logout
│   ├── 📂 db/                        # 🗄️ Camada de dados
│   │   ├── schema.ts                 #   Schema do banco (Drizzle)
│   │   ├── index.ts                  #   Conexão com o banco
│   │   ├── seed.ts                   #   Dados iniciais
│   │   └── migrate-categories.ts     #   Migração de categorias
│   ├── 📂 lib/                       # 📚 Utilitários
│   │   ├── asaas.ts                  #   Integração Asaas (pagamentos)
│   │   ├── google-maps.ts            #   Integração Google Maps
│   │   ├── permissions.ts            #   Controle de permissões
│   │   ├── uploadthing.ts            #   Config UploadThing
│   │   └── utils.ts                  #   Helpers gerais
│   ├── 📂 stores/                    # 🏪 State Management
│   │   └── cart-store.ts             #   Store do carrinho (Zustand)
│   └── 📂 types/                     # 📝 Tipos TypeScript
├── 📂 public/                        # 📁 Arquivos estáticos
├── 📂 drizzle/                       # 📂 Migrações do banco
├── drizzle.config.ts                 # ⚙️ Config do Drizzle Kit
├── next.config.ts                    # ⚙️ Config do Next.js
├── tailwind.config.ts                # ⚙️ Config do Tailwind
├── tsconfig.json                     # ⚙️ Config do TypeScript
└── package.json                      # 📦 Dependências
```

---

## ⚡ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

| Ferramenta | Versão mínima | Como verificar |
|---|---|---|
| 🟢 [Node.js](https://nodejs.org/) | 18.x ou superior | `node --version` |
| 📦 [npm](https://www.npmjs.com/) | 9.x ou superior | `npm --version` |
| 🐙 [Git](https://git-scm.com/) | qualquer | `git --version` |

Você também precisará de contas nos seguintes serviços:

- 🔐 [Clerk](https://clerk.com/) — Autenticação
- 🗄️ [Neon](https://neon.tech/) — Banco de dados PostgreSQL
- 💳 [Asaas](https://www.asaas.com/) — Pagamentos (sandbox disponível)
- 🗺️ [Google Cloud Platform](https://console.cloud.google.com/) — Maps API
- 📤 [UploadThing](https://uploadthing.com/) — Upload de imagens

---

## 🚀 Como Rodar

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/AbilioGamaNetoJ/restaurante-rei-picadao.git
cd restaurante-rei-picadao
```

### 2️⃣ Instale as dependências

```bash
npm install
```

### 3️⃣ Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (veja a seção [Variáveis de Ambiente](#-variáveis-de-ambiente) para detalhes):

```bash
cp .env.example .env
```

### 4️⃣ Sincronize o banco de dados

```bash
# Empurra o schema para o banco (desenvolvimento)
npx drizzle-kit push

# OU aplique migrações (produção)
npx drizzle-kit migrate
```

### 5️⃣ (Opcional) Popule com dados iniciais

```bash
npx tsx src/db/seed.ts
```

### 6️⃣ Inicie o servidor de desenvolvimento

```bash
npm run dev
```

### 7️⃣ Acesse no navegador

| Área | URL |
|---|---|
| 🛒 Loja | [http://localhost:3000](http://localhost:3000) |
| 📊 Dashboard | [http://localhost:3000/dashboard](http://localhost:3000/dashboard) |
| 🔐 Login | [http://localhost:3000/sign-in](http://localhost:3000/sign-in) |

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz com as seguintes variáveis:

```env
# 🔐 Clerk (Autenticação)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=sua_chave_publica_aqui
CLERK_SECRET_KEY=sua_chave_secreta_aqui
CLERK_WEBHOOK_SECRET=seu_webhook_secret_aqui

# 🗄️ Neon Database (PostgreSQL)
DATABASE_URL=sua_connection_string_aqui

# 💳 Asaas (Pagamentos)
ASAAS_API_KEY=sua_chave_asaas_aqui
ASAAS_WEBHOOK_TOKEN=seu_token_webhook_aqui

# 🗺️ Google Maps
GOOGLE_MAPS_API_KEY=sua_chave_google_maps_aqui

# 📤 UploadThing (Upload de imagens)
UPLOADTHING_TOKEN=seu_token_uploadthing_aqui

# 🌐 App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Importante:** Nunca commite o arquivo `.env` no Git. Ele já está no `.gitignore`.

---

## 🗄️ Banco de Dados

O projeto usa **Drizzle ORM** com **Neon PostgreSQL**. O schema está definido em `src/db/schema.ts`.

### 📊 Modelo de Dados

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  categories  │────<│   products   │────<│    addons     │
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ name         │     │ name         │     │ name         │
│ slug         │     │ price        │     │ price        │
│ type         │     │ imageUrl     │     │ categoryId   │
│ sortOrder    │     │ isAvailable  │     │ isAvailable  │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    orders    │────<│  orderItems  │────<│orderItemAddons│
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ customerName │     │ productName  │     │ addonName    │
│ status       │     │ quantity     │     │ addonPrice   │
│ total        │     │ subtotal     │     │ quantity     │
│ deliveryFee  │     │ comment      │     │              │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│storeSettings │────<│  storeHours  │     │   expenses   │
│              │     │              │     │              │
│ name         │     │ dayOfWeek    │     │ description  │
│ address      │     │ openTime     │     │ amount       │
│ deliveryFee  │     │ closeTime    │     │ category     │
│ minOrder     │     │              │     │ createdBy    │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐
│    users     │     │savedAddresses│
│              │     │              │
│ clerkId      │     │ customerEmail│
│ email        │     │ label        │
│ role         │     │ addressStreet│
│ name         │     │ lat / lng    │
└──────────────┘     └──────────────┘
```

### 🔧 Comandos do Drizzle

```bash
# Visualizar o schema no Drizzle Studio
npx drizzle-kit studio

# Push do schema para o banco (sem gerar SQL)
npx drizzle-kit push

# Gerar arquivos de migração
npx drizzle-kit generate

# Aplicar migrações
npx drizzle-kit migrate

# Rodar seed
npx tsx src/db/seed.ts
```

---

## 📡 API Routes

Todas as rotas da API estão em `src/app/api/`:

| Método | Rota | Descrição |
|---|---|---|
| `GET/POST` | `/api/categorias` | Listar / Criar categorias |
| `PATCH/DELETE` | `/api/categorias/[id]` | Atualizar / Deletar categoria |
| `GET/POST` | `/api/produtos` | Listar / Criar produtos |
| `PATCH/DELETE` | `/api/produtos/[id]` | Atualizar / Deletar produto |
| `GET/POST` | `/api/pedidos` | Listar / Criar pedidos |
| `PATCH` | `/api/pedidos/[id]` | Atualizar status do pedido |
| `POST` | `/api/checkout` | Processar pagamento via Asaas |
| `POST` | `/api/frete` | Calcular frete por distância |
| `GET/POST` | `/api/despesas` | Listar / Criar despesas |
| `GET/POST` | `/api/funcionarios` | Listar / Criar funcionários |
| `POST` | `/api/uploadthing` | Upload de arquivos |
| `POST` | `/api/webhooks/clerk` | Webhook do Clerk (sync usuários) |
| `POST` | `/api/webhooks/asaas` | Webhook do Asaas (status pagamento) |

---

## 🧩 Principais Componentes

| Componente | Local | Descrição |
|---|---|---|
| `StorefrontClient` | `src/app/(store)/` | Página principal da loja com cardápio |
| `CartStore` | `src/stores/cart-store.ts` | State do carrinho com Zustand |
| `DashboardLayout` | `src/app/(dashboard)/layout.tsx` | Layout do painel admin com sidebar |
| `shadcn/ui` | `src/components/ui/` | Componentes base de interface |

---

## 🌐 Deploy

### Vercel (Recomendado)

A maneira mais fácil de fazer deploy é usando a [Vercel](https://vercel.com/):

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente no painel
3. Deploy automático a cada push na `main`

```bash
# Build de produção local (para testar)
npm run build
npm run start
```

### ⚙️ Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | 🔄 Inicia o servidor de desenvolvimento (Turbopack) |
| `npm run build` | 📦 Gera o build de produção |
| `npm run start` | 🚀 Inicia o servidor de produção |
| `npm run lint` | 🔍 Executa o ESLint |

---

## 📚 Referências

- 📖 [Documentação Next.js](https://nextjs.org/docs)
- 📖 [Documentação Drizzle ORM](https://orm.drizzle.team/docs/overview)
- 📖 [Documentação Clerk](https://clerk.com/docs)
- 📖 [Documentação Asaas](https://docs.asaas.com/)
- 📖 [Documentação UploadThing](https://docs.uploadthing.com/)
- 📖 [Google Maps Routes API](https://developers.google.com/maps/documentation/routes)
- 📖 [shadcn/ui](https://ui.shadcn.com/docs)
- 📖 [Tailwind CSS v4](https://tailwindcss.com/docs)

---

<div align="center">

Feito com ❤️ para o **Rei do Picadão**

🍖 _A melhor porção da cidade!_ 🍖

</div>
