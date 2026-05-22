# Pedido Finalizado Atualiza Receita no Dashboard

## Goal
Garantir que quando um pedido é marcado como "Entregue" (status `delivered`), a Receita Mês no Dashboard do dono seja atualizada corretamente. O fluxo de atualização do status do pedido deve disparar `revalidatePath('/dashboard')` para que os KPIs reflitam o novo valor.

## Context
- **Fluxo de status do pedido:** `src/app/(dashboard)/pedidos/pedidos-client.tsx` — define o fluxo: `pending → paid → preparing → ready → delivering → delivered`. O status é atualizado via `updateOrderStatus()`.
- **Action de update:** `src/app/(dashboard)/pedidos/actions.ts` — `updateOrderStatus(orderId, newStatus)` atualiza o status no banco e faz `revalidatePath('/pedidos')`.
- **Dashboard atual:** `src/app/(dashboard)/dashboard/page.tsx` — calcula Receita Mês com `SUM(orders.total) WHERE status = 'paid'`. **Problema:** usa apenas `status = 'paid'`, mas pedidos que avançam para `preparing`, `ready`, `delivering`, `delivered` **saem** desse filtro se o status mudou de `paid` para o próximo.
- **Schema:** `orders` com enum `order_status`: `pending, paid, preparing, ready, delivering, delivered, cancelled`.

## Tasks
- [x] **Corrigir filtro de receita no Dashboard:** Em `src/app/(dashboard)/dashboard/page.tsx`, alterar a query de receita para incluir **todos os status que indicam pedido pago/finalizado**, não apenas `paid`. Usar:
  ```sql
  WHERE status IN ('paid', 'preparing', 'ready', 'delivering', 'delivered')
  AND createdAt >= startOfMonth
  ```
  Isso garante que receita não "desapareça" quando o pedido avança no fluxo.
- [x] **Revalidar Dashboard ao mudar status:** Em `src/app/(dashboard)/pedidos/actions.ts`, adicionar `revalidatePath('/dashboard')` após `revalidatePath('/pedidos')` na função `updateOrderStatus()`. Isso faz o dashboard atualizar quando o operador muda o status de um pedido.
- [x] **Verificar webhook Asaas:** Se existir webhook de pagamento (`src/app/api/webhooks/asaas/`), garantir que ele também faz `revalidatePath('/dashboard')` quando um pagamento é confirmado.

## Done When
- [x] Receita Mês no Dashboard inclui pedidos com status `paid`, `preparing`, `ready`, `delivering` e `delivered`
- [x] Quando um pedido é marcado como `delivered`, o Dashboard reflete o valor atualizado na próxima visita/refresh
- [x] `revalidatePath('/dashboard')` é chamado em `updateOrderStatus()`
- [x] `npm run build` passa sem erros

## Notes
- A receita é contabilizada quando o pagamento é confirmado (`paid`), não quando o pedido é entregue. O que a task corrige é que pedidos que avançaram de `paid` para outros status não devem sair do cálculo de receita.
- `revalidatePath` invalida o cache da page — na próxima visita ao `/dashboard`, os dados estarão atualizados.
- Pedidos `cancelled` e `pending` (não pagos) continuam fora da receita.
