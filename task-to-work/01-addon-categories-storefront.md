# Group Addons by Category in Product Detail Modal

## Goal
Replace the single "Adicionais" heading in the customer-facing product detail modal with grouped sections by addon category (e.g., "Molhos", "Bebidas"), similar to iFood's layout. Products may have addons from multiple categories.

## Context
- **Current behavior:** `src/components/store/product-detail-modal.tsx` (line 152) renders all addons under a single `<h4>Adicionais</h4>` heading with a flat list.
- **Desired behavior:** Group addons by their `category` field (each addon already has `addon.category` coming from the DB relation `addons.categoryId → categories`). Display each group with its own header (e.g., "Molhos", "Bebidas") styled like iFood — a highlighted section header with subtitle "Escolha até X opção".
- **DB schema:** `addons` table has `categoryId` FK → `categories` table. The `categories` table has a `type` enum (`'produto'` or `'adicional'`). Addon categories use `type = 'adicional'`.
- **Data flow:** `storefront-client.tsx` passes `product.addons` (which is `{ addon: Addon }[]`) to `ProductDetailModal`. The `Addon` interface (line 21-27) currently has a `category: string` field but it's not populated with category name from the relation.

## Tasks
- [ ] **Ensure addon category data reaches the modal:** In `src/app/(store)/page.tsx`, verify the query includes `addon.category` relation (nested `with: { addon: { with: { category: true } } }`). Update the `Addon` interface in `product-detail-modal.tsx` to include `category: { id: string; name: string }` or similar.
- [ ] **Group addons by category in the modal:** In `product-detail-modal.tsx`, replace the flat `product.addons.map(...)` (lines 153-181) with a grouped render: extract unique categories from `product.addons`, then for each category render a section header + its addons list.
- [ ] **Style the category headers like iFood:** Each category group should have a highlighted header bar (e.g., gray background, bold title like "Molho Extra!!", subtitle "Escolha até 1 opção." with a green checkmark icon). Use clean spacing between groups.
- [ ] **Handle products with no addons or single-category addons:** If a product has addons from only one category, still show the category header. If no addons, keep the existing empty state.

## Done When
- [ ] Opening a product with addons from different categories (e.g., "Bebidas" + "Molhos") shows them grouped with separate headers
- [ ] Each category section has a styled header matching iFood's pattern
- [ ] Products with addons from a single category still display correctly with the section header

## Notes
- The iFood reference images show: a gray banner with bold category name + "Escolha até X opção." text + green checkmark, followed by addon items below
- Keep the existing addon quantity increment/decrement UX (Adicionar button → +/- controls)
- Remember that a product can have multiple addons from the same category AND from different categories simultaneously
