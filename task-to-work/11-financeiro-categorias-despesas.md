# Financeiro — Categorias de Despesas Estruturadas

## Goal
Aprimorar a seção Financeiro (`/financeiro`) para que o dono possa registrar despesas com categorias predefinidas: Assinaturas, Alimentos/Insumos, Energia, Motoboys, Salários, Água, Aluguel, Manutenção, Marketing e Outros. Substituir o input de texto livre por um `<select>` com essas categorias + opção de "Outros" com input custom.

## Context
- **Financeiro atual:** `src/app/(dashboard)/financeiro/financeiro-client.tsx` — formulário de "Nova Despesa" com campos: Descrição (text), Valor R$ (number), Categoria (text livre — `placeholder="Ex: Insumos, Água, Luz"`). Exibe lista de despesas com total.
- **Actions:** `src/app/(dashboard)/financeiro/actions.ts` — `createExpense()` e `deleteExpense()`. Salva `description`, `amount`, `category`, `createdBy`.
- **Schema:** `expenses` com `category` (text) — já aceita qualquer string.
- **Problema:** Categoria é texto livre, o que gera inconsistência ("Luz" vs "Energia" vs "Conta de luz"). Isso prejudica relatórios e o gráfico de Gastos por Categoria no Dashboard (task 07).

## Tasks
- [ ] **Definir categorias predefinidas:** Criar constante em `src/lib/expense-categories.ts`:
  ```ts
  export const EXPENSE_CATEGORIES = [
    { value: 'assinaturas', label: 'Assinaturas' },
    { value: 'alimentos', label: 'Alimentos / Insumos' },
    { value: 'energia', label: 'Energia Elétrica' },
    { value: 'agua', label: 'Água' },
    { value: 'aluguel', label: 'Aluguel' },
    { value: 'motoboys', label: 'Motoboys / Entregadores' },
    { value: 'salarios', label: 'Salários' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'marketing', label: 'Marketing / Publicidade' },
    { value: 'embalagens', label: 'Embalagens' },
    { value: 'outros', label: 'Outros' },
  ] as const;
  ```
- [ ] **Atualizar formulário:** Em `financeiro-client.tsx`, substituir o `<Input>` de categoria (linhas 111-119) por um `<select>` com as categorias predefinidas. Se "Outros" for selecionado, mostrar um input de texto para descrição customizada.
- [ ] **Formatação de valor:** Trocar o input de valor (tipo `number`, step 0.01) por um input de texto com a mesma lógica `sanitizeAndFormatPrice` usada em Produtos — aceitar vírgula como decimal no formato brasileiro.
- [ ] **Melhorar listagem:** Na lista de despesas, exibir a label da categoria (não o value). Agrupar ou filtrar por categoria seria um plus.
- [ ] **Filtro por mês:** Adicionar filtro mensal na listagem (← →) para ver despesas de meses específicos, não todas de uma vez.
- [ ] **Editar despesa:** Adicionar funcionalidade de editar uma despesa existente (hoje só tem criar e excluir). Adicionar action `updateExpense()` em `actions.ts`.

## Done When
- [ ] Formulário de Nova Despesa tem `<select>` com categorias predefinidas
- [ ] Selecionar "Outros" mostra campo de texto para categoria customizada
- [ ] Input de valor aceita formato brasileiro (vírgula como decimal)
- [ ] Lista de despesas mostra label legível da categoria
- [ ] É possível editar uma despesa existente
- [ ] `npm run build` passa sem erros

## Notes
- As categorias predefinidas são essenciais para o gráfico de Gastos por Categoria no Dashboard (task 07)
- Despesas existentes com categorias de texto livre devem continuar aparecendo normalmente (retrocompatibilidade)
- A constante `EXPENSE_CATEGORIES` deve ser importável tanto no client quanto no server
- Manter o campo `category` como text no schema — não precisa de enum no DB (flexibilidade para "Outros")
