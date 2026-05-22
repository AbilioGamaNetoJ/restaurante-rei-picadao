# Dashboard Visão Geral — KPIs Completos com Navegação Mensal

## Goal
Reconstruir a página de Dashboard do dono (`/dashboard`) com KPIs empresariais completos: Capital Total, Receita Mês, Despesa Mês (inclui salários, assinaturas, alimentos, energia, etc.), Saldo Operacional, Funcionários Ativos e Total de Produtos. Adicionar navegação por meses (calendário horizontal deslizante) e gráficos de Fluxo de Caixa + Gastos por Categoria.

## Context
- **Dashboard atual:** `src/app/(dashboard)/dashboard/page.tsx` — server component simples que mostra 5 cards: Faturamento Hoje, Faturamento Mês, Pedidos Totais, Ticket Médio, Cancelamentos. Faz queries direto na tabela `orders` filtrando por status `paid`.
- **Tabela de despesas:** `src/db/schema.ts` → `expenses` com `id, description, amount, category, createdBy, createdAt`. Já sendo usada em `/financeiro`.
- **Tabela de users:** `users` com `role`, `salary` (a ser adicionado na task 06), `isActive`.
- **Tabela de products:** `products` com `isAvailable`.
- **Tabela de orders:** `orders` com `total`, `status`, `createdAt`.
- **Acesso:** Apenas role `dono` — já tem redirect para `/pedidos` se não for dono.

## Tasks
- [ ] **Refatorar dashboard/page.tsx (server):** Fazer queries para:
  - **Receita Mês:** `SUM(orders.total)` WHERE status IN (`paid`, `delivered`) AND `createdAt` no mês selecionado.
  - **Despesa Mês:** `SUM(expenses.amount)` WHERE `createdAt` no mês selecionado + `SUM(users.salary)` dos funcionários ativos (salários mensais fixos).
  - **Saldo Operacional:** Receita - Despesa.
  - **Capital Total:** Somatório histórico de todos os saldos operacionais (ou receita total - despesa total).
  - **Funcionários Ativos:** `COUNT(users)` WHERE `role` IN (`funcionario`, `gerente`, `dono`) AND `isActive = true`.
  - **Total de Produtos:** `COUNT(products)`.
  - Aceitar query param `?month=2026-05` para filtro mensal.
- [ ] **Criar dashboard-client.tsx:** Novo client component com:
  - **6 KPI cards** no topo: Capital Total (ícone banco), Receita Mês (ícone receita), Despesa Mês (ícone despesa), Saldo Operacional (ícone tendência), Funcionários Ativos (ícone pessoas), Total Produtos (ícone caixa).
  - **Navegação mensal:** Seletor de período com botões ← → para navegar entre meses. Exibir "PERÍODO SELECIONADO: ÚLTIMOS 12 MESES" e filtros rápidos 1M, 3M, 6M, 12M, Tudo.
  - **Gráfico Fluxo de Caixa:** Line/bar chart mostrando receita vs despesa ao longo dos meses (últimos 12 meses). Usar uma lib leve como `recharts`.
  - **Gráfico Gastos por Categoria:** Donut/pie chart mostrando distribuição das despesas por categoria (Salários, Alimentos, Energia, Assinaturas, etc.).
- [ ] **Instalar recharts:** `npm install recharts` para os gráficos. É compatível com React 19 e SSR-friendly.
- [ ] **Estilizar conforme referência:** Cards com borda sutil, ícones coloridos, fundo branco. Gráficos em cards separados lado a lado. Manter o design system do projeto (shadcn/ui + Tailwind).
- [ ] **Dados mensais para gráficos:** Criar query que agrupe receita e despesa por mês nos últimos 12 meses para alimentar o gráfico de Fluxo de Caixa.

## Done When
- [ ] Dashboard exibe 6 KPI cards: Capital Total, Receita Mês, Despesa Mês, Saldo Operacional, Funcionários Ativos, Total Produtos
- [ ] Navegação mensal funciona (← →) atualizando os KPIs para o mês selecionado
- [ ] Gráfico de Fluxo de Caixa mostra receita vs despesa nos últimos 12 meses
- [ ] Gráfico de Gastos por Categoria mostra pizza/donut com distribuição das despesas
- [ ] Despesa Mês inclui salários dos funcionários ativos + despesas registradas no `/financeiro`
- [ ] `npm run build` passa sem erros

## Notes
- Saldo Operacional = Receita Mês - Despesa Mês (pode ser negativo)
- Capital Total é um acumulado — se nunca houve transação, começa em R$ 0,00
- Salários são custos fixos mensais — sempre contam na Despesa Mês se o funcionário estiver ativo
- A imagem de referência mostra: cards em grid horizontal, gráfico de linhas à esquerda, donut chart à direita
- Dependência: Task 06 (salary no schema de users) deve ser feita antes para que salários entrem no cálculo
