# Checkpoint — Admin & Shared Packages (Selesai)

> Dibuat 2026-07-20. Arsip progres yang sudah selesai untuk mengurangi beban context.

---

## Admin Dashboard (`apps/admin/`)

### Business Hours — selesai ✅
- **Commit:** `ddefc2c`
- **File:** `features/business-hours/` — BusinessHoursScreen, outlet details, scheduling
- **Status:** lint & typecheck pass, build ok

### Orders — selesai ✅
- **Commit:** `7e500d5`
- **File:** `features/orders/` — OrderDetailScreen, OrderListScreen, status management
- **Status:** lint & typecheck pass, build ok

### POS Cashier — selesai ✅
- **Commit:** `1b70901`
- **File:** `features/pos/` — PosCashierScreen, session management, cart, checkout (`usePosCashier.ts`)
- **Test:** `usePosCashier.test.tsx`
- **Status:** lint & typecheck pass, build ok

### Inventory — selesai ✅
- **Commit:** `b227db7`
- **File:** `features/inventory/` — InventoryScreen, InventoryMaterialsScreen, InventoryMovementsScreen, InventoryHppScreen
- **Components:** InventoryMaterialsTable, InventoryMovementsTable, InventoryHppTable, InventoryMaterialEditorDialog, InventoryMovementDialog, InventoryRecipeDialog
- **Hooks:** useInventoryMaterials, useInventoryMovements, useInventoryHpp, inventoryConstants
- **Test:** `InventoryScreens.test.tsx`
- **Status:** lint & typecheck pass, build ok

### Menu Editor — selesai ✅
- **Commits:** `cbd4023`, `57e6f25`
- **File:** `features/menu-editor/` — MenuEditorScreen, availability, details, sales schedule, delete
- **Status:** lint & typecheck pass, build ok

### Variant Category Editor — selesai ✅
- **Commit:** `4c35d74`
- **Status:** lint & typecheck pass, build ok

### Navigation & Routing — selesai ✅
- **Commits:** `ab6ffbd`, `ddefc2c`
- **File:** `app/AppRoutes.tsx`, `app/navigation.tsx`, `app/navigation.test.tsx`
- **Test:** `navigation.test.tsx`
- **Status:** lint & typecheck pass, build ok

---

## Shared Packages

### `packages/data/` — InventoryRepository ✅
- **Commit:** `b227db7`
- **Files:** `repositories/InventoryRepository.ts`, `mocks/InMemoryInventoryRepository.ts`, `mocks/WarungMengInventoryMockData.ts`
- **Test:** `InMemoryInventoryRepository.test.ts`
- **Export:** ditambahkan ke `index.ts`
- **Status:** backward-compatible

### `packages/domain/` — Inventory types ✅
- **Commit:** `b227db7`
- **Export:** ditambahkan ke `index.ts`

### `packages/i18n/` — Translations ✅
- **Commits:** `ab6ffbd`, `ddefc2c`
- **File:** `translations.ts` — entri baru untuk inventory, POS, orders, business hours

---

## Storefront (`apps/storefront/`)

**Status: Masih awal — hanya boilerplate**
- Set up: `main.tsx`, `App.tsx` (placeholder), `vite-env.d.ts`
- Port 3001
- `AGENTS.md` — aturan storefront sudah didokumentasikan
- **Belum ada** screen, feature, atau component storefront yang dikerjakan

---

## Teknologi

| Stack | Versi |
|-------|-------|
| React | 19 |
| React Router | 7 |
| Vite | 8 |
| TypeScript | 6 |
| Ant Design | 6 |
| Testing Library | terbaru |
| Vitest | 4 |

---

## Definition of Done (masih berlaku)

1. ✅ Ikuti feature ownership (`features/<name>/application|components|screens`)
2. ✅ `App.tsx` tetap composition root kecil
3. ✅ `App.tsx` kecil
4. ✅ user-facing text sesuai kontrak i18n
5. ✅ test untuk logic penting
6. ✅ lint & typecheck pass
7. ✅ build pass
8. ✅ browser QA jujur — Playwright kalau ada perubahan visual/responsive
9. ✅ unrelated changes tidak tersentuh
