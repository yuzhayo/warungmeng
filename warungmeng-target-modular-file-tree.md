# Warung Meng — Target Modular File Tree

Status: Proposed target architecture; belum diimplementasikan  
Target: Plug-and-Play Modular Control Center Architecture  
Companion prompt: `warungmeng-plug-and-play-modular-refactor-prompt.md`

## 1. Legend

| Marker       | Responsibility                                   |
| ------------ | ------------------------------------------------ |
| `[BOOT]`     | Bootstrap; mount runtime saja                    |
| `[COMP]`     | Composition root dan concrete dependency wiring  |
| `[MANIFEST]` | Static module identity dan contributions         |
| `[EXT]`      | Registration adapter antara module dan runtime   |
| `[APP]`      | Headless orchestration, command, presenter, port |
| `[HOOK]`     | React lifecycle adapter menuju application layer |
| `[UI]`       | React/AntD presentational UI                     |
| `[SCREEN]`   | Route-level composition parent                   |
| `[DOMAIN]`   | Pure business types, rules, validation           |
| `[DATA]`     | Repository contract dan concrete adapter         |
| `[I18N]`     | Translation dan formatting contract              |
| `[TEST]`     | Behavior atau architecture protection            |

`manifest` bukan tempat business logic. `extension` bukan service locator. `screen`
bukan repository owner.

## 2. Repository Target

```text
warungmeng/
├─ apps/
│  ├─ admin/                                      # Admin Control Center
│  └─ storefront/                                 # Customer Runtime
├─ packages/
│  ├─ module-system/                              # NEW: headless module contracts/runtime
│  ├─ domain/                                     # Existing pure business rules
│  ├─ data/                                       # Existing repositories and adapters
│  ├─ i18n/                                       # Existing locale/format contracts
│  ├─ ui-admin/                                   # Admin-family reusable UI/theme
│  ├─ ui-storefront/                              # Storefront-family reusable UI
│  └─ config/                                     # Shared configuration
├─ .docs/
│  ├─ ROADMAP.md
│  ├─ MODULAR-MIGRATION-LEDGER.md                 # Current → target comparison ledger
│  └─ MODULAR-MIGRATION-EVIDENCE.md               # Phase evidence and parity results
├─ CLAUDE.md
├─ package.json
├─ warungmeng-plug-and-play-modular-refactor-prompt.md
└─ warungmeng-target-modular-file-tree.md
```

`packages/module-system` adalah package internal baru yang perlu disetujui pada phase
scaffold. Package ini tidak memerlukan third-party dependency.

## 3. Shared Headless Module System

```text
packages/module-system/
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ index.ts                                    # Public exports only
   ├─ contracts/
   │  ├─ moduleSurface.ts                         # [DOMAIN] admin | storefront
   │  ├─ moduleId.ts                              # [DOMAIN] stable ID contract
   │  ├─ moduleManifest.ts                        # [MANIFEST] base manifest contract
   │  ├─ moduleExtension.ts                       # [EXT] registration contract
   │  ├─ moduleContribution.ts                    # [MANIFEST] contribution union
   │  ├─ moduleDependency.ts                      # [DOMAIN] required/optional dependency
   │  ├─ moduleCapability.ts                      # [DOMAIN] capability identity
   │  └─ moduleDiagnostic.ts                      # [DOMAIN] safe diagnostics
   ├─ registry/
   │  ├─ createModuleRegistry.ts                  # [APP] registry factory
   │  ├─ moduleRegistry.ts                        # [APP] registry public port
   │  ├─ registerModule.ts                        # [APP] deterministic registration
   │  ├─ resolveModuleOrder.ts                    # [DOMAIN] dependency ordering
   │  └─ validateModuleGraph.ts                   # [DOMAIN] duplicate/cycle validation
   ├─ capabilities/
   │  ├─ capabilityRegistry.ts                    # [APP] capability lookup port
   │  ├─ createCapabilityRegistry.ts              # [APP] concrete in-memory registry
   │  ├─ registerCapability.ts                    # [APP] stable registration
   │  └─ resolveCapability.ts                     # [APP] explicit missing capability
   ├─ discovery/
   │  ├─ discoverModuleCandidates.ts              # [APP] validates supplied candidates
   │  ├─ moduleCandidate.ts                       # [DOMAIN] unknown candidate contract
   │  └─ moduleDiscoveryResult.ts                 # [DOMAIN] valid/invalid results
   ├─ diagnostics/
   │  ├─ createModuleDiagnosticCollector.ts       # [APP]
   │  └─ moduleDiagnosticSink.ts                  # [APP] diagnostic port
   └─ tests/
      ├─ moduleManifest.test.ts                   # [TEST]
      ├─ moduleRegistry.test.ts                   # [TEST]
      ├─ moduleDependencyGraph.test.ts            # [TEST]
      ├─ capabilityRegistry.test.ts               # [TEST]
      └─ moduleSurfaceBoundary.test.ts            # [TEST]
```

Package ini dilarang mengimpor React, React Router, AntD, CSS, browser storage,
`apps/*`, atau concrete Warung Meng repository.

## 4. Admin Control Center Target

```text
apps/admin/src/
├─ main.tsx                                       # [BOOT] mount <App />
├─ App.tsx                                        # [COMP] providers + runtime + router only
├─ app/
│  ├─ composition/
│  │  ├─ createAdminRuntime.ts                    # [COMP] assemble registries/adapters
│  │  ├─ createAdminRepositories.ts               # [COMP] concrete mock repository wiring
│  │  ├─ createAdminStorageAdapters.ts            # [COMP] browser storage wiring
│  │  ├─ adminRuntime.ts                          # [APP] UI-facing runtime contract
│  │  └─ AdminRuntimeProvider.tsx                 # [HOOK] runtime React bridge
│  ├─ discovery/
│  │  ├─ adminModuleCandidates.ts                 # [COMP] import.meta.glob/explicit imports
│  │  ├─ discoverAdminModules.ts                  # [APP] surface-specific discovery
│  │  └─ adminModuleDiagnostics.ts                # [APP] diagnostic presenter
│  ├─ routing/
│  │  ├─ AdminRouter.tsx                          # [UI] HashRouter adapter
│  │  ├─ AdminRoutes.tsx                          # [UI] renders resolved routes
│  │  ├─ resolveAdminRoutes.ts                    # [APP] manifest → route view model
│  │  ├─ adminRouteComponentRegistry.ts           # [COMP] route ID → lazy component
│  │  └─ AdminRouteErrorScreen.tsx                # [SCREEN]
│  ├─ navigation/
│  │  ├─ resolveAdminNavigation.ts                # [APP] manifest → navigation view model
│  │  ├─ adminIconRegistry.tsx                    # [UI] icon ID → AntD icon
│  │  └─ adminNavigationViewModel.ts              # [APP]
│  └─ providers/
│     └─ AdminApplicationProviders.tsx            # [COMP] i18n + AdminUi + runtime
├─ components/
│  └─ layout/
│     ├─ AdminShell.tsx                           # [UI] parent layout
│     ├─ AdminHeader.tsx                          # [UI] child
│     ├─ AdminSidebar.tsx                         # [UI] child, consumes nav view model
│     ├─ AdminModuleDiagnosticAlert.tsx           # [UI] safe startup diagnostics
│     └─ *.css
├─ features/
│  ├─ dashboard/
│  │  ├─ manifest/
│  │  │  ├─ dashboardManifest.ts                  # [MANIFEST] route/nav/capabilities
│  │  │  └─ dashboardExtension.ts                 # [EXT] register reporting.read
│  │  ├─ application/
│  │  │  ├─ ports/dashboardRepositoriesPort.ts    # [APP]
│  │  │  ├─ presenters/dashboardPresenter.ts      # [APP]
│  │  │  ├─ controllers/useDashboardController.ts # [HOOK]
│  │  │  └─ models/                               # Existing pure report view models
│  │  ├─ components/                              # [UI] cards, period, data state
│  │  ├─ views/                                   # [UI] sales/menu/inventory reports
│  │  ├─ screens/                                 # [SCREEN] overview/reports
│  │  └─ index.ts                                 # Public manifest/extension only
│  ├─ menu/
│  │  ├─ manifest/
│  │  │  ├─ menuManifest.ts                       # [MANIFEST]
│  │  │  └─ menuExtension.ts                      # [EXT] catalog.read/manage
│  │  ├─ application/
│  │  │  ├─ commands/                             # Category/variant/menu commands
│  │  │  ├─ ports/menuCatalogPort.ts
│  │  │  ├─ presenters/                           # List/editor view models
│  │  │  └─ controllers/                          # Hooks only
│  │  ├─ components/                              # [UI] forms, tables, toolbar
│  │  ├─ views/                                   # [UI] variant list composition
│  │  ├─ screens/                                 # [SCREEN] list/editor/shell
│  │  └─ index.ts
│  ├─ orders/
│  │  ├─ manifest/
│  │  │  ├─ ordersManifest.ts
│  │  │  └─ ordersExtension.ts                    # orders.read/manage
│  │  ├─ application/
│  │  │  ├─ commands/cancelOrderCommand.ts        # [APP] atomic cross-domain orchestration
│  │  │  ├─ ports/
│  │  │  │  ├─ orderRepositoryPort.ts
│  │  │  │  ├─ inventoryReversalPort.ts
│  │  │  │  └─ financeRefundPort.ts
│  │  │  ├─ presenters/
│  │  │  └─ controllers/
│  │  ├─ components/                              # [UI] list/detail/status/totals
│  │  ├─ screens/                                 # [SCREEN] list/detail
│  │  └─ index.ts
│  ├─ pos/
│  │  ├─ manifest/
│  │  │  ├─ posManifest.ts
│  │  │  └─ posExtension.ts                       # pos.session/cart/checkout
│  │  ├─ application/
│  │  │  ├─ commands/                             # open/close/checkout
│  │  │  ├─ ports/                                # catalog/order/inventory/session storage
│  │  │  ├─ presenters/
│  │  │  ├─ controllers/
│  │  │  └─ adapters/browserPosSessionAdapter.ts  # [DATA] app-local browser adapter
│  │  ├─ components/                              # [UI] catalog/cart/modals/session
│  │  ├─ screens/PosCashierScreen.tsx
│  │  └─ index.ts
│  ├─ inventory/
│  │  ├─ manifest/
│  │  │  ├─ inventoryManifest.ts
│  │  │  └─ inventoryExtension.ts                 # inventory.read/adjust/reverse
│  │  ├─ application/
│  │  │  ├─ commands/                             # movement/recipe/material commands
│  │  │  ├─ ports/inventoryRepositoryPort.ts
│  │  │  ├─ presenters/
│  │  │  └─ controllers/
│  │  ├─ components/                              # [UI] tables/dialogs
│  │  ├─ screens/                                 # [SCREEN] materials/movements/HPP
│  │  └─ index.ts
│  ├─ finance/
│  │  ├─ manifest/
│  │  │  ├─ financeManifest.ts
│  │  │  └─ financeExtension.ts                   # finance.read/record/refund
│  │  ├─ application/
│  │  │  ├─ commands/                             # transaction/expense commands
│  │  │  ├─ ports/financeRepositoryPort.ts
│  │  │  ├─ presenters/
│  │  │  └─ controllers/
│  │  ├─ components/                              # [UI] tables/cards/dialogs
│  │  ├─ screens/                                 # [SCREEN] shell/overview/list/expense
│  │  └─ index.ts
│  └─ settings/
│     ├─ manifest/
│     │  ├─ settingsManifest.ts                   # Parent navigation/route contribution
│     │  └─ settingsExtension.ts
│     ├─ screens/SettingsScreen.tsx               # [SCREEN] outlet for child modules
│     ├─ theme/
│     │  ├─ manifest/themeManifest.ts
│     │  ├─ manifest/themeExtension.ts
│     │  ├─ application/                          # Theme storage/presenter/controller
│     │  ├─ components/                           # [UI] controls/editor/preview
│     │  └─ screens/ThemeSettingsScreen.tsx
│     ├─ business-hours/
│     │  ├─ manifest/businessHoursManifest.ts
│     │  ├─ manifest/businessHoursExtension.ts
│     │  ├─ application/                          # Model/port/controller
│     │  ├─ components/                           # [UI] outlet/schedule
│     │  └─ screens/BusinessHoursScreen.tsx
│     └─ index.ts
├─ screens/
│  └─ AdminNotFoundScreen.tsx                     # [SCREEN] app-wide only
└─ tests/
   ├─ adminModuleDiscovery.test.ts                # [TEST]
   ├─ adminRouteContributions.test.tsx            # [TEST]
   ├─ adminNavigationContributions.test.ts        # [TEST]
   └─ adminImportBoundary.test.ts                 # [TEST]
```

## 5. Storefront Customer Runtime Target

```text
apps/storefront/src/
├─ main.tsx                                       # [BOOT]
├─ App.tsx                                        # [COMP]
├─ app/
│  ├─ composition/
│  │  ├─ createStorefrontRuntime.ts               # [COMP]
│  │  ├─ createStorefrontRepositories.ts          # [COMP]
│  │  ├─ createStorefrontStorageAdapters.ts       # [COMP]
│  │  ├─ storefrontRuntime.ts                     # [APP]
│  │  └─ StorefrontRuntimeProvider.tsx            # [HOOK]
│  ├─ discovery/
│  │  ├─ storefrontModuleCandidates.ts            # [COMP]
│  │  └─ discoverStorefrontModules.ts             # [APP]
│  ├─ routing/
│  │  ├─ StorefrontRouter.tsx                     # [UI] BrowserRouter adapter
│  │  ├─ StorefrontRoutes.tsx                     # [UI]
│  │  ├─ resolveStorefrontRoutes.ts               # [APP]
│  │  └─ storefrontRouteComponentRegistry.ts      # [COMP]
│  └─ providers/
│     └─ StorefrontApplicationProviders.tsx       # [COMP] i18n/theme/cart/runtime
├─ components/
│  └─ layout/
│     ├─ StorefrontShell.tsx                      # [UI] parent
│     ├─ StorefrontHeader.tsx                     # [UI] child
│     └─ StorefrontShell.module.css
├─ features/
│  ├─ catalog/
│  │  ├─ manifest/
│  │  │  ├─ catalogManifest.ts
│  │  │  └─ catalogExtension.ts                   # catalog.read/configure
│  │  ├─ application/
│  │  │  ├─ commands/                             # Add/configure intent, no JSX
│  │  │  ├─ ports/storefrontCatalogPort.ts
│  │  │  ├─ presenters/                           # Catalog/detail view models
│  │  │  ├─ models/                               # Search/filter/detail pure logic
│  │  │  └─ controllers/                          # useCatalog/useMenuDetail
│  │  ├─ components/                              # [UI] hero/tabs/grid/card/detail
│  │  ├─ screens/                                 # [SCREEN] catalog/menu detail
│  │  └─ index.ts
│  ├─ cart/
│  │  ├─ manifest/
│  │  │  ├─ cartManifest.ts
│  │  │  └─ cartExtension.ts                      # cart.read/manage
│  │  ├─ application/
│  │  │  ├─ commands/                             # add/edit/remove/clear
│  │  │  ├─ ports/cartStoragePort.ts
│  │  │  ├─ adapters/browserCartStorageAdapter.ts # [DATA] localStorage boundary
│  │  │  ├─ models/                               # Validation/totals
│  │  │  └─ controllers/                          # Provider/hook bridges
│  │  ├─ components/                              # [UI] item/list/summary
│  │  ├─ screens/CartScreen.tsx
│  │  └─ index.ts
│  ├─ checkout/
│  │  ├─ manifest/
│  │  │  ├─ checkoutManifest.ts
│  │  │  └─ checkoutExtension.ts                  # checkout.submit
│  │  ├─ application/
│  │  │  ├─ commands/createStorefrontOrderCommand.ts
│  │  │  ├─ ports/checkoutOrderPort.ts
│  │  │  ├─ presenters/checkoutPresenter.ts
│  │  │  └─ controllers/useCheckoutController.ts
│  │  ├─ components/                              # [UI] form sections/sticky action
│  │  ├─ screens/CheckoutScreen.tsx
│  │  └─ index.ts
│  └─ order-confirmation/
│     ├─ manifest/
│     │  ├─ orderConfirmationManifest.ts
│     │  └─ orderConfirmationExtension.ts         # storefront.order.read-recent
│     ├─ application/
│     │  ├─ ports/recentOrderReceiptStoragePort.ts
│     │  ├─ adapters/browserRecentOrderReceiptAdapter.ts
│     │  ├─ presenters/orderConfirmationPresenter.ts
│     │  └─ controllers/useOrderConfirmationController.ts
│     ├─ components/                              # [UI] result/status/items/totals/actions
│     ├─ screens/OrderConfirmationScreen.tsx
│     └─ index.ts
├─ screens/
│  └─ StorefrontNotFoundScreen.tsx
├─ styles/global.css
└─ tests/
   ├─ storefrontModuleDiscovery.test.ts
   ├─ storefrontRouteContributions.test.tsx
   └─ storefrontImportBoundary.test.ts
```

Storefront `cart`, `checkout`, dan `order-confirmation` adalah sibling modules. Mereka
tidak boleh mengimpor internal file satu sama lain. Koordinasi dilakukan melalui
capability atau public application contract yang didaftarkan.

## 6. Existing Business Packages Target

```text
packages/domain/src/
├─ catalog/        # [DOMAIN] types, validation, variant selection
├─ orders/         # [DOMAIN] types and transitions
├─ pos/            # [DOMAIN] session, pricing, cart, checkout
├─ inventory/      # [DOMAIN] types, units, stock, HPP
├─ finance/        # [DOMAIN] types, validation, ledger, calculations
├─ reporting/      # [DOMAIN] dashboard and reports
└─ index.ts

packages/data/src/
├─ repositories/   # [DATA] capability-neutral repository contracts
├─ mocks/          # [DATA] in-memory adapters and fixtures
├─ adapters/       # [DATA] future HTTP/persistence adapters; not created speculatively
└─ index.ts

packages/i18n/src/
├─ translations.ts # [I18N] ID/EN keys
├─ formatters.ts   # [I18N] stable Rupiah formatting
├─ preferences.ts
├─ WarungMengI18nProvider.tsx
└─ index.ts
```

Module manifest hanya mereferensikan translation key. Business names dan Rupiah
formatting tetap milik data/domain/i18n, bukan manifest.

## 7. Parent–Child Contract

```text
Workspace
├─ Shared headless packages
├─ Admin surface
│  ├─ Composition root
│  │  ├─ Module registry
│  │  ├─ Capability registry
│  │  ├─ Concrete adapters
│  │  └─ Router/UI resolvers
│  ├─ Admin shell
│  │  ├─ Header
│  │  ├─ Sidebar
│  │  └─ Resolved route outlet
│  └─ Feature module
│     ├─ Manifest
│     ├─ Extension
│     ├─ Application controller
│     └─ Screen
│        ├─ View
│        └─ Presentational components
└─ Storefront surface
   └─ hierarchy yang sama dengan registry terpisah
```

| Parent           | Child                      | Contract                                             |
| ---------------- | -------------------------- | ---------------------------------------------------- |
| Composition root | Registry                   | Memberi candidate, adapters, configuration           |
| Registry         | Extension                  | Memanggil `register(context)` setelah validation     |
| Extension        | Capability registry        | Mendaftarkan capability publik milik module          |
| Extension        | Manifest                   | Membawa identity dan static contributions            |
| Router resolver  | Manifest contribution      | Mengubah route ID menjadi React route element        |
| Shell            | Navigation view model      | Menerima data siap render, bukan raw manifests       |
| Screen           | Controller/hook            | Meminta state dan commands                           |
| Screen           | View/components            | Mengirim props dan callbacks                         |
| Controller       | Headless command/presenter | Mengadaptasi React lifecycle                         |
| Command          | Port                       | Meminta capability/repository tanpa concrete adapter |
| Adapter          | Repository port            | Mengimplementasikan I/O                              |
| Domain rule      | Tidak memiliki child I/O   | Pure dan deterministic                               |

### Child rules

1. Child tidak mengimpor parent yang merendernya.
2. Component tidak mengimpor screen.
3. Screen tidak membuat concrete repository.
4. Manifest tidak mengimpor screen atau AntD.
5. Extension boleh mereferensikan public registration factory, bukan internal UI.
6. Sibling feature tidak mengimpor internal sibling.
7. Shared coordination dinaikkan ke capability contract atau composition root.
8. Props membawa view model dan callback, bukan mutable repository.

## 8. UI–Logic–Data Contract

```text
User event
  → [UI] component callback
  → [SCREEN/HOOK] controller command
  → [APP] headless command/policy
  → [DOMAIN] validation/calculation
  → [APP] port
  → [DATA] adapter/repository
  → [APP] normalized result + presenter
  → [HOOK] React state bridge
  → [UI] render
```

| Concern                                          | Owner                                   |
| ------------------------------------------------ | --------------------------------------- |
| AntD component, CSS, focus, visual state         | UI component                            |
| Route params and navigation outcome              | Screen/router adapter                   |
| Loading/error/retry/request identity             | Controller/application                  |
| Action permission and transition                 | Domain/application policy               |
| Formatting view data                             | Presenter/i18n                          |
| Business calculation                             | Domain                                  |
| Repository interface                             | Data package or narrow application port |
| In-memory/HTTP/browser storage                   | Concrete adapter                        |
| Module identity/dependencies/static contribution | Manifest                                |
| Cross-module public operation                    | Capability                              |

## 9. State Ownership

| State                               | Target owner                       |
| ----------------------------------- | ---------------------------------- |
| Active route                        | Router                             |
| Sidebar collapse and local shell UI | Admin shell                        |
| Module registration status          | Module registry                    |
| Module diagnostics                  | Diagnostic collector               |
| Catalog request state               | Catalog controller                 |
| Menu editor draft                   | Menu editor controller             |
| Cart                                | Cart capability/provider           |
| Checkout submission lock            | Checkout controller                |
| Recent receipt                      | Receipt storage adapter            |
| POS session                         | POS capability + storage port      |
| Theme preference                    | Theme capability + storage adapter |
| Locale preference                   | `@warungmeng/i18n`                 |
| Order/inventory/finance records     | Repository adapters                |
| Business transition rules           | `@warungmeng/domain`               |

State tidak boleh diduplikasi di manifest, registry, screen, dan component sekaligus.

## 10. Import Contract

Allowed:

```text
apps/*/app → feature public entry
feature manifest → module-system contracts + i18n key types
feature extension → module-system contracts + feature application public contract
feature screen → same-feature application/components
feature application → domain + repository/capability ports
data → domain
ui-admin/ui-storefront → React/AntD and their own public contracts
```

Forbidden:

```text
admin → storefront
storefront → admin
domain → data/app/UI/module runtime
component → repository/concrete adapter/manifest registry
manifest → React/AntD/screen/concrete adapter
feature A → feature B internal path
shared package → apps/*
module-system → Warung Meng business domain or React
```

## 11. Migration Ledger Contract

Setiap current file harus memiliki satu baris:

| Field                  | Required content                                       |
| ---------------------- | ------------------------------------------------------ |
| Current path           | File/source owner sekarang                             |
| Current responsibility | UI, logic, route, state, data, CSS, i18n, test         |
| Current consumers      | Importers/runtime callers                              |
| Protected behavior     | Behavior yang tidak boleh hilang                       |
| Target path            | Owner pada tree target                                 |
| Migration action       | Keep, move, split, adapt, replace, delete              |
| Compatibility path     | Temporary bridge jika ada                              |
| Test evidence          | Characterization/parity test                           |
| Status                 | Unmapped, mapped, scaffolded, wired, verified, retired |

Tidak ada legacy file yang boleh dihapus sebelum row-nya berstatus `verified` dan seluruh
consumer telah berpindah.

## 12. Scaffold Boundary

Scaffold awal boleh membuat:

- `packages/module-system`;
- Admin dan Storefront composition/discovery/routing skeleton;
- manifest/extension folder dan public entry setiap current feature;
- architecture tests;
- migration ledger.

Scaffold awal tidak boleh:

- menyalin implementation lama menjadi duplicate aktif;
- mengubah route atau business behavior;
- mengganti repository contract;
- mengaktifkan remote plugins;
- menghapus current routes/navigation;
- memindahkan seluruh feature sebelum compatibility wiring tersedia.

Setelah scaffold, wiring dilakukan per vertical module:

```text
manifest → extension → capability → existing logic → existing UI → existing route
```

Setelah parity:

```text
existing logic/UI dipindahkan ke target owner → legacy import dihapus → ledger verified
```
