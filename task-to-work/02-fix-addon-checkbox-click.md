# Fix Addon Checkbox Click Target in Dashboard Product Form

## Goal
Fix the bug where clicking directly on the checkbox input inside the addon selection card (dashboard product form) does not toggle the addon. Only clicking the surrounding area works.

## Context
- **File:** `src/app/(dashboard)/produtos/produtos-client.tsx`, lines 288-306
- **Root cause:** The checkbox `<input>` at line 305 has `onClick={(e) => e.stopPropagation()}` which prevents the click from bubbling up to the parent `<div>` that calls `toggleAddon()`. The checkbox also has `onChange={() => {}}` (no-op), so clicking it directly does nothing.
- **Current flow:** Parent `<div>` (line 288) has `onClick={() => toggleAddon(addon.id)}`. The checkbox is rendered as a visual indicator only, with `checked={formData.addonsIds.includes(addon.id)}` but its own click is swallowed by `stopPropagation`.

## Tasks
- [ ] **Remove `stopPropagation` from the checkbox:** In `produtos-client.tsx` line 305, remove `onClick={(e) => e.stopPropagation()}` from the `<input type="checkbox">`.
- [ ] **Wire up onChange to toggleAddon:** Change `onChange={() => {}}` (line 303) to `onChange={() => toggleAddon(addon.id)}` so clicking the checkbox itself also toggles the addon.
- [ ] **Prevent double-toggle from parent click:** Since both the parent `div` click and the checkbox `onChange` could fire, add `e.stopPropagation()` inside a proper handler or restructure so the parent div delegates to the checkbox. The simplest fix: keep parent `onClick`, remove checkbox `stopPropagation`, and set checkbox `readOnly` instead of `onChange={() => {}}`. OR: move `toggleAddon` to the checkbox `onChange` and remove it from the parent div.

## Done When
- [ ] Clicking directly on the checkbox toggles the addon selection (checked/unchecked)
- [ ] Clicking anywhere else on the addon card also toggles the addon selection
- [ ] Visual state (checked/unchecked) updates correctly in both cases
- [ ] No double-toggle occurs (clicking checkbox doesn't toggle twice)

## Notes
- Recommended approach: Keep parent `onClick={() => toggleAddon(addon.id)}`, change the checkbox to use `readOnly` prop instead of empty `onChange`, and remove the `onClick={(e) => e.stopPropagation()}`. This way the parent handles all clicks including those on the checkbox.
