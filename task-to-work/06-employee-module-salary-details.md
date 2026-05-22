# Módulo de Funcionários — Salário, Cargo, Setor, Status

## Goal
Refatorar a seção de Equipe (`/funcionarios`) para exibir uma tabela completa com: Nome, Email, Cargo, Setor, Acesso (role Clerk), Salário, Status (Ativo/Inativo) e Ações (editar/excluir). O dono deve poder inserir e editar o salário de cada colaborador. Layout inspirado na imagem de referência — tabela limpa com filtros "Ativos / Inativos / Todos" e botão "Cadastrar Funcionário".

## Context
- **Página atual:** `src/app/(dashboard)/funcionarios/page.tsx` — server component que puxa users do Clerk via `clerkClient().users.getUserList()` e serializa `{ id, firstName, lastName, email, imageUrl, role }`.
- **Client atual:** `src/app/(dashboard)/funcionarios/funcionarios-client.tsx` — exibe cards simples com foto, nome, email e um `<select>` de role. Não tem campos de salário, cargo, setor, data de entrada nem status.
- **Actions:** `src/app/(dashboard)/funcionarios/actions.ts` — apenas `updateUserRole()` que atualiza Clerk `publicMetadata.role` e sincroniza na tabela `users` do DB.
- **Schema DB:** Tabela `users` tem: `id, clerkId, name, email, role, createdAt, updatedAt`. **Não tem** campos `salary`, `position` (cargo), `department` (setor) ou `isActive` (status).
- **Auth:** Clerk é o provider de auth. Roles: `dono`, `gerente`, `funcionario`, `cliente`.

## Tasks
- [ ] **Adicionar colunas no schema:** Em `src/db/schema.ts`, adicionar na tabela `users`: `salary` (numeric, nullable), `position` (text, nullable — "Gestor", "Vendedor", etc.), `department` (text, nullable — "Logística", "Vendas", etc.), `isActive` (boolean, default true). Rodar `drizzle-kit push` para sincronizar.
- [ ] **Atualizar actions:** Em `src/app/(dashboard)/funcionarios/actions.ts`:
  - Criar `updateEmployee(clerkId, data)` — atualiza `salary`, `position`, `department`, `isActive` na tabela `users`.
  - Criar `deleteEmployee(clerkId)` — remove o user do banco e reseta a role no Clerk para `cliente`.
  - Manter `updateUserRole()` existente funcionando.
- [ ] **Atualizar page.tsx server:** Em `src/app/(dashboard)/funcionarios/page.tsx`, além de buscar do Clerk, fazer JOIN com a tabela `users` para trazer `salary`, `position`, `department`, `isActive`, `createdAt` (data de entrada). Passar todos esses dados serializados para o client.
- [ ] **Refatorar funcionarios-client.tsx:** Substituir o layout de cards por uma tabela com colunas: NOME (nome + email), CARGO, SETOR, ACESSO (badge com role), SALÁRIO (R$ formatado), STATUS (badge "ATIVO"/"INATIVO"), AÇÕES (botões editar/excluir).
  - Adicionar filtros "Ativos / Inativos / Todos" no topo direito (como na imagem).
  - Adicionar botão "Cadastrar Funcionário" que abre Dialog para inserir cargo, setor, salário e role de um user existente.
  - Editar abre Dialog com campos: cargo, setor, salário, role, status ativo/inativo.
  - Manter a nota de que funcionários precisam se cadastrar primeiro como clientes.
- [ ] **Formatação de salário:** Usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para exibir salários. Input deve aceitar vírgula como decimal (mesmo pattern de `sanitizeAndFormatPrice` usado em produtos).

## Done When
- [ ] Tabela de funcionários exibe: Nome+Email, Cargo, Setor, Acesso (role), Salário, Status, Ações
- [ ] Dono consegue editar salário, cargo, setor e status de um funcionário
- [ ] Filtros "Ativos / Inativos / Todos" funcionam
- [ ] Schema do banco tem as novas colunas `salary`, `position`, `department`, `isActive`
- [ ] TypeScript sem erros, `npm run build` passa

## Notes
- O campo `createdAt` da tabela `users` serve como "data de entrada na empresa" (momento em que o dono deu acesso)
- Clerk continua sendo a fonte principal de auth — o banco `users` é um espelho com dados extras
- A role no `<select>` deve respeitar as permissões: gerente só cria funcionário, dono pode criar gerente/dono
- Imagem de referência mostra layout de tabela (não cards), com fundo branco, linhas separadoras sutis
