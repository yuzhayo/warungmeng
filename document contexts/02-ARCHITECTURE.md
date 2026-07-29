# Warung Meng — 02-ARCHITECTURE.md

> Audited from live checkout: 24 Juli 2026.
> Checkout HEAD saat audit: `a441c0a`; latest production-source commit: `09ad95a`.
> Pembanding target: `06-TARGET-FILE-TREE.md` dan
> `MODULAR-REFACTOR-PROMPT.md`.
> Status keseluruhan: **kode aktual sudah feature-oriented dan sebagian besar layered,
> tetapi composition route/navigation masih terpusat dan module runtime belum ada.**

Audit arsitektur harus menggunakan live checkout. `warungmeng-project.zip` hanya artifact
transfer yang mengikuti `.gitignore`; ZIP tersebut tidak memuat semua governing instructions
dan canonical `.docs`.

## 1. Stack

- React 19, React Router 7, Vite 8, TypeScript 6, Ant Design 6, Vitest 4.
- npm workspaces monorepo.
- Data mode saat ini: **frontend-first, mock repository** (belum ada backend).
- Dua aplikasi terpisah:
  - `apps/admin` — Admin Control Center, port 3000.
  - `apps/storefront` — Customer Runtime, port 3001.

## 2. Repository Map (Current)

```text
warungmeng/
├─ apps/
│  ├─ admin/        (React app, Ant Design, admin operational console)
│  └─ storefront/   (React app, CSS Modules, mobile-first customer catalog)
├─ packages/
│  ├─ domain/        # pure business types & rules (catalog, orders, inventory, finance, pos, reporting)
│  ├─ data/           # repository contracts + in-memory mock adapters
│  ├─ i18n/           # ID/EN translation provider + formatters
│  ├─ ui-admin/       # Ant Design theme system for admin
│  ├─ ui-storefront/  # storefront shared UI (minimal so far)
│  └─ config/         # shared configuration
├─ tools/codex-claude-bridge/  # internal dev tooling, bukan bagian runtime app
├─ .docs/                      # roadmap, phase plans, QA, debt; ignored tetapi canonical lokal
├─ document contexts/          # context ringkas untuk migrasi
├─ MODULAR-REFACTOR-PROMPT.md
└─ 06-TARGET-FILE-TREE.md
```

Sudah ada di live checkout: `01-PRD.md`, `01-PRD.md`, phase plan,
QA report, dan storefront plan index. File-file itu tidak ikut dalam ZIP karena `.docs`
diabaikan Git, bukan karena tidak ada.

Belum diimplementasikan: `packages/module-system`, module manifest/extension runtime,
route/navigation resolver berbasis manifest. Migration ledger dan evidence file
(`document contexts/MODULAR-MIGRATION-EVIDENCE.md`) dibuat sebagai output Phase 00 dan
harus selalu dibandingkan ulang dengan live checkout.

## 3. Current Layering (Admin, per-feature)

Setiap feature admin (`dashboard`, `menu`, `finance`, `inventory`, `pos`, `orders`,
`settings`) sudah mempunyai pemisahan owner yang berguna, walaupun belum seragam penuh:

```text
apps/admin/src/features/<feature>/
├─ components/     # presentational, AntD
├─ views/           # sebagian feature saja (dashboard, menu)
├─ application/     # hooks (useXController), kadang command/presenter terpisah
├─ screens/         # route-level composition
└─ tests/           # sebagian feature (finance)
```

Route dan navigasi didefinisikan terpusat, bukan per-modul:

- `apps/admin/src/app/AppRoutes.tsx` — seluruh `<Route>` admin dalam satu file.
- `apps/admin/src/app/navigation.tsx` — seluruh sidebar nav item dalam satu file
  (`navigation.performance`, `navigation.menu`, `navigation.finance`, `navigation.inventory`,
  `navigation.pos`, `navigation.orders`, `navigation.settings`).

Gap target bukan ketiadaan feature layering. Gap utamanya adalah navigation dan route
masih dirakit manual di app shell, belum berasal dari manifest tiap modul, belum ada
capability registry, dan belum ada automated module-boundary enforcement.

## 4. Current Layering (Storefront)

```text
apps/storefront/src/
├─ app/            # ApplicationProviders, AppRoutes, storefrontTheme — semua terpusat
├─ features/       # catalog, orders, checkout, cart — masing-masing components/application/screens
└─ components/
```

Storefront route (`apps/storefront/src/app/AppRoutes.tsx`): `/`, `/menu/:menuSlug`, `/cart`,
`/checkout`, `/orders/:orderId`, fallback `NotFoundScreen`. Sama seperti admin — semua route
didaftarkan terpusat, bukan lewat manifest per-feature.

## 5. Shared Packages (Current)

| Package                     | Isi                                                                                                                                                                     | Catatan boundary                           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `@warungmeng/domain`        | Pure types + rules: `catalog`, `orders`, `inventory`, `finance`, `pos`, `reporting`                                                                                     | Tidak boleh import data/UI/module-runtime  |
| `@warungmeng/data`          | Repository interface (`MenuRepository`, `OrderRepository`, `InventoryRepository`, `FinanceRepository`) + `InMemory*` mock adapters + mock data seed                     | Import domain saja                         |
| `@warungmeng/i18n`          | `WarungMengI18nProvider`, `translations.ts` (paritas ID/EN dijaga test), `formatters.ts` (Rupiah, dsb.), `preferences.ts`                                               | —                                          |
| `@warungmeng/ui-admin`      | `AdminUiProvider`, `adminTheme.ts`, theme system lengkap: `createAdminTheme`, `themeContrast`, `themeDefaults`, `themeRandomizer`, `themeSerialization`, `themeStorage` | Khusus AntD/admin                          |
| `@warungmeng/ui-storefront` | Baru minimal (`index.ts`)                                                                                                                                               | Belum banyak diekstrak dari storefront app |
| `@warungmeng/config`        | Shared config                                                                                                                                                           | —                                          |

## 6. Target Architecture (Belum Diimplementasikan)

Target: **Plug-and-Play Modular Control Center Architecture** — empat fondasi:

1. **Declarative UI** — nav/route/action berasal dari kontribusi manifest modul.
2. **Headless Logic Engine** — business rule jalan tanpa React/DOM/router/CSS/AntD.
3. **Manifest Discovery** — modul dikenali lewat manifest tervalidasi, bukan daftar tersebar.
4. **Stable Extension Contracts** — modul menambah capability via public contract, bukan
   import internal modul lain.

Package baru yang direncanakan: `packages/module-system` (kontrak headless: manifest,
extension, registry, capability, discovery, diagnostics — **tanpa** React/AntD/CSS/apps
dependency). Tiap feature app akan mendapat folder `manifest/` + `extension/` di sampingnya,
dan `App.tsx`/`AppRoutes.tsx`/`navigation.tsx` akan digantikan oleh composition root +
route/nav resolver yang membaca manifest, bukan hardcode.

Lihat `05-RULES.md` untuk import contract & guardrail, `01-PRD.md` untuk cakupan produk, dan
`04-SCHEMA.md` untuk kontrak data domain lengkap.

## 7. UI–Logic–Data Flow (Target)

```text
User event → [UI] component callback → [SCREEN/HOOK] controller command
  → [APP] headless command/policy → [DOMAIN] validation/calculation → [APP] port
  → [DATA] adapter/repository → [APP] normalized result + presenter
  → [HOOK] React state bridge → [UI] render
```

## 8. Migration Status

| Item                                              | Status                                                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/module-system`                          | Belum dibuat                                                                       |
| `07-MODULAR-MIGRATION-LEDGER.md`                  | Dibuat pada Phase 00; status row awal masih harus diverifikasi per vertical module |
| `document contexts/MODULAR-MIGRATION-EVIDENCE.md` | Skeleton dibuat; row per wave/module masih menunggu evidence eksekusi              |
| Manifest/extension per feature                    | Belum dibuat                                                                       |
| Route/nav resolver                                | Belum dibuat, masih hardcode di `AppRoutes.tsx` / `navigation.tsx`                 |
| Existing feature logic (domain/data/hooks)        | Tetap dipertahankan — refactor tidak boleh mengubah behavior                       |

## 9. Source-of-Truth Order

1. Instruksi user untuk task aktif.
2. `CLAUDE.md` dan `AGENTS.md` terdekat.
3. Source, tests, package manifests, dan configuration live checkout.
4. `01-PRD.md`, active phase plan, QA report, dan technical debt.
5. Dokumen dalam `document contexts/` sebagai ringkasan.
6. ZIP atau dokumen historis hanya sebagai transfer/reference evidence.

Jika ringkasan context bertentangan dengan live code atau governing instructions,
ringkasan context yang harus diperbaiki.
