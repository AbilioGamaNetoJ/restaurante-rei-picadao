# Add Delete Button for Cancelled Orders

## Goal
Allow dashboard users to permanently delete cancelled order cards, since cancelled orders don't contribute to metrics in the following month.

## Context
- **File (frontend):** `src/app/(dashboard)/pedidos/pedidos-client.tsx` — the "Cancelados" tab (line 29) shows orders with `status = 'cancelled'`.
- **File (backend):** `src/app/(dashboard)/pedidos/actions.ts` — currently only has `updateOrderStatus()`. No `deleteOrder()` action exists yet.
- **DB schema:** `orders` table in `src/db/schema.ts` (line 135). Deleting an order should cascade to `order_items` and `order_item_addons` (both have `onDelete: 'cascade'`).

## Tasks
- [ ] **Create `deleteOrder` server action:** In `src/app/(dashboard)/pedidos/actions.ts`, add a `deleteOrder(orderId: string)` function that authenticates via Clerk, deletes the order from the DB using `db.delete(orders).where(eq(orders.id, orderId))`, and calls `revalidatePath('/pedidos')`.
- [ ] **Add delete button to cancelled order cards:** In `pedidos-client.tsx`, inside `<CardFooter>` (line 141), when `order.status === 'cancelled'`, render a destructive `<Button>` with a trash icon and "Excluir" label.
- [ ] **Add confirmation dialog:** Before deleting, show a `confirm()` dialog: "Deseja realmente excluir este pedido cancelado? Esta ação é irreversível."
- [ ] **Wire up the handler:** Import `deleteOrder` from `./actions`, create a `handleDelete` function in the component that calls it inside `startTransition`, and show success/error toasts.

## Done When
- [ ] Cancelled order cards show a "Excluir" button (only in the "Cancelados" tab)
- [ ] Clicking "Excluir" shows a confirmation prompt
- [ ] After confirming, the order is deleted from the DB and the card disappears
- [ ] Active and completed orders do NOT show a delete button

## Notes
- Only cancelled orders should be deletable — never active or completed ones
- The cascade delete in the schema will handle cleaning up `order_items` and `order_item_addons` automatically
