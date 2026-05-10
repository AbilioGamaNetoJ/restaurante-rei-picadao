# Group Orders by Year and Month in Dashboard

## Goal
In the orders dashboard, group completed ("Finalizados") and cancelled ("Cancelados") orders by year and month, so the store owner can quickly see which months had the most sales.

## Context
- **File:** `src/app/(dashboard)/pedidos/pedidos-client.tsx`
- **Current behavior:** `filteredOrders` is a flat list rendered as a grid of cards (line 64-165). No date grouping exists.
- **Data:** Each order has `order.createdAt` (timestamp). Orders are passed as `initialOrders` prop.

## Tasks
- [ ] **Create a grouping utility:** Write a function `groupOrdersByMonth(orders)` that takes the filtered orders array and returns a `Map<string, Order[]>` or sorted array of `{ label: string, orders: Order[] }`, grouped by `YYYY-MM`. Sort groups in reverse chronological order (newest month first).
- [ ] **Add month/year section headers:** In the render for "Finalizados" and "Cancelados" tabs, iterate over groups instead of the flat list. Each group gets a header like "Maio 2026" or "Abril 2026" with the order count and optionally the total revenue for that month.
- [ ] **Keep the "Ativos" tab flat:** Active orders should NOT be grouped by month — they need real-time visibility without date grouping.
- [ ] **Style the month headers:** Add a clear visual separator between months. Display month name in Portuguese (use `toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })`) with total order count badge.

## Done When
- [ ] "Finalizados" tab shows orders grouped under month/year headings (e.g., "Maio 2026 — 12 pedidos")
- [ ] "Cancelados" tab also shows orders grouped under month/year headings
- [ ] Groups are sorted newest-first
- [ ] "Ativos" tab remains unchanged (flat list)

## Notes
- Use Portuguese month names via `Intl.DateTimeFormat` or `toLocaleDateString('pt-BR')`
- Consider showing a small revenue summary per month in the "Finalizados" tab (sum of `order.total`)
- This is a frontend-only change — no backend modifications needed
