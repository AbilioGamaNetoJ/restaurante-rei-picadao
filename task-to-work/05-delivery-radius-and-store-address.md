# Replace Delivery Fee Per KM with Max Radius + Store Address

## Goal
On the customer-facing storefront hero section, replace the "R$ 1.50 / km" delivery fee indicator with a message stating the store does not deliver beyond 10 km, and display the store's address in the same info section.

## Context
- **File:** `src/app/(store)/storefront-client.tsx`, lines 168-174
- **Current display:** A bike icon + `R$ {deliveryFeeKm} / km` text showing the per-km delivery cost.
- **Store settings available:** `settings.deliveryRadiusKm` (default `'10'`), `settings.address` (store address string), `settings.deliveryFeeKm`.
- The `settings` object is already passed to `StorefrontClient` from `page.tsx` (line 41-48).

## Tasks
- [ ] **Replace the delivery fee indicator:** In `storefront-client.tsx` lines 168-174, replace the `R$ X.XX / km` content with a message like "Não entregamos acima de 10 km" (using `settings.deliveryRadiusKm`). Keep the bike icon or use a map pin icon.
- [ ] **Add the store address:** Below the existing info pills (rating, time, delivery) or in a new row, add a section displaying the store address from `settings.address`. Use a `MapPin` or location icon.
- [ ] **Style consistently:** Match the existing info pill design (icon with background + text). Keep it clean, mobile-friendly, and aligned with the current design language.

## Done When
- [ ] The storefront hero no longer shows "R$ 1.50 / km"
- [ ] Instead it shows a message about the maximum delivery radius (e.g., "Não entregamos acima de 10 km")
- [ ] The store address is visible in the info section
- [ ] Both are responsive and look good on mobile and desktop

## Notes
- Use `settings.deliveryRadiusKm` dynamically — don't hardcode "10 km"
- The store address comes from `settings.address` (text field in `store_settings` table)
- Consider using `lucide-react` icons like `MapPin` for the address indicator
