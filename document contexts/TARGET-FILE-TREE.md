# Warung Meng â€” Target Modular File Tree

Status: Proposed target architecture; belum diimplementasikan  
Target: Plug-and-Play Modular Control Center Architecture  
Companion prompt: `MODULAR-REFACTOR-PROMPT.md`

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
â”œâ”€ apps/
â”‚  â”œâ”€ admin/                                      # Admin Control Center
â”‚  â””â”€ storefront/                                 # Customer Runtime
â”œâ”€ packages/
â”‚  â”œâ”€ module-system/                              # NEW: headless module contracts/runtime
â”‚  â”œâ”€ domain/                                     # Existing pure business rules
â”‚  â”œâ”€ data/                                       # Existing repositories and adapters
â”‚  â”œâ”€ i18n/                                       # Existing locale/format contracts
â”‚  â”œâ”€ ui-admin/                                   # Admin-family reusable UI/theme
â”‚  â”œâ”€ ui-storefront/                              # Storefront-family reusable UI
â”‚  â””â”€ config/                                     # Shared configuration
â”œâ”€ .docs/
â”‚  â”œâ”€ ROADMAP.md
â”‚  â”œâ”€ MODULAR-MIGRATION-LEDGER.md                 # Current â†’ target comparison ledger
â”‚  â””â”€ MODULAR-MIGRATION-EVIDENCE.md               # Phase evidence and parity results
â”œâ”€ CLAUDE.md
â”œâ”€ package.json
â”œâ”€ MODULAR-REFACTOR-PROMPT.md
â””â”€ TARGET-FILE-TREE.md
```

`packages/module-system` adalah package internal baru yang perlu disetujui pada phase
scaffold. Package ini tidak memerlukan third-party dependency.

## 3. Shared Headless Module System

```text
packages/module-system/
â”œâ”€ package.json
â”œâ”€ tsconfig.json
â””â”€ src/
   â”œâ”€ index.ts                                    # Public exports only
   â”œâ”€ contracts/
   â”‚  â”œâ”€ moduleSurface.ts                         # [DOMAIN] admin | storefront
   â”‚  â”œâ”€ moduleId.ts                              # [DOMAIN] stable ID contract
   â”‚  â”œâ”€ moduleManifest.ts                        # [MANIFEST] base manifest contract
   â”‚  â”œâ”€ moduleExtension.ts                       # [EXT] registration contract
   â”‚  â”œâ”€ moduleContribution.ts                    # [MANIFEST] contribution union
   â”‚  â”œâ”€ moduleDependency.ts                      # [DOMAIN] required/optional dependency
   â”‚  â”œâ”€ moduleCapability.ts                      # [DOMAIN] capability identity
   â”‚  â””â”€ moduleDiagnostic.ts                      # [DOMAIN] safe diagnostics
   â”œâ”€ registry/
   â”‚  â”œâ”€ createModuleRegistry.ts                  # [APP] registry factory
   â”‚  â”œâ”€ moduleRegistry.ts                        # [APP] registry public port
   â”‚  â”œâ”€ registerModule.ts                        # [APP] deterministic registration
   â”‚  â”œâ”€ resolveModuleOrder.ts                    # [DOMAIN] dependency ordering
   â”‚  â””â”€ validateModuleGraph.ts                   # [DOMAIN] duplicate/cycle validation
   â”œâ”€ capabilities/
   â”‚  â”œâ”€ capabilityRegistry.ts                    # [APP] capability lookup port
   â”‚  â”œâ”€ createCapabilityRegistry.ts              # [APP] concrete in-memory registry
   â”‚  â”œâ”€ registerCapability.ts                    # [APP] stable registration
   â”‚  â””â”€ resolveCapability.ts                     # [APP] explicit missing capability
   â”œâ”€ discovery/
   â”‚  â”œâ”€ discoverModuleCandidates.ts              # [APP] validates supplied candidates
   â”‚  â”œâ”€ moduleCandidate.ts                       # [DOMAIN] unknown candidate contract
   â”‚  â””â”€ moduleDiscoveryResult.ts                 # [DOMAIN] valid/invalid results
   â”œâ”€ diagnostics/
   â”‚  â”œâ”€ createModuleDiagnosticCollector.ts       # [APP]
   â”‚  â””â”€ moduleDiagnosticSink.ts                  # [APP] diagnostic port
   â””â”€ tests/
      â”œâ”€ moduleManifest.test.ts                   # [TEST]
      â”œâ”€ moduleRegistry.test.ts                   # [TEST]
      â”œâ”€ moduleDependencyGraph.test.ts            # [TEST]
      â”œâ”€ capabilityRegistry.test.ts               # [TEST]
      â””â”€ moduleSurfaceBoundary.test.ts            # [TEST]
```

Package ini dilarang mengimpor React, React Router, AntD, CSS, browser storage,
`apps/*`, atau concrete Warung Meng repository.

## 4. Admin Control Center Target

```text
apps/admin/src/
â”œâ”€ main.tsx                                       # [BOOT] mount <App />
â”œâ”€ App.tsx                                        # [COMP] providers + runtime + router only
â”œâ”€ app/
â”‚  â”œâ”€ composition/
â”‚  â”‚  â”œâ”€ createAdminRuntime.ts                    # [COMP] assemble registries/adapters
â”‚  â”‚  â”œâ”€ createAdminRepositories.ts               # [COMP] concrete mock repository wiring
â”‚  â”‚  â”œâ”€ createAdminStorageAdapters.ts            # [COMP] browser storage wiring
â”‚  â”‚  â”œâ”€ adminRuntime.ts                          # [APP] UI-facing runtime contract
â”‚  â”‚  â””â”€ AdminRuntimeProvider.tsx                 # [HOOK] runtime React bridge
â”‚  â”œâ”€ discovery/
â”‚  â”‚  â”œâ”€ adminModuleCandidates.ts                 # [COMP] import.meta.glob/explicit imports
â”‚  â”‚  â”œâ”€ discoverAdminModules.ts                  # [APP] surface-specific discovery
â”‚  â”‚  â””â”€ adminModuleDiagnostics.ts                # [APP] diagnostic presenter
â”‚  â”œâ”€ routing/
â”‚  â”‚  â”œâ”€ AdminRouter.tsx                          # [UI] HashRouter adapter
â”‚  â”‚  â”œâ”€ AdminRoutes.tsx                          # [UI] renders resolved routes
â”‚  â”‚  â”œâ”€ resolveAdminRoutes.ts                    # [APP] manifest â†’ route view model
â”‚  â”‚  â”œâ”€ adminRouteComponentRegistry.ts           # [COMP] route ID â†’ lazy component
â”‚  â”‚  â””â”€ AdminRouteErrorScreen.tsx                # [SCREEN]
â”‚  â”œâ”€ navigation/
â”‚  â”‚  â”œâ”€ resolveAdminNavigation.ts                # [APP] manifest â†’ navigation view model
â”‚  â”‚  â”œâ”€ adminIconRegistry.tsx                    # [UI] icon ID â†’ AntD icon
â”‚  â”‚  â””â”€ adminNavigationViewModel.ts              # [APP]
â”‚  â””â”€ providers/
â”‚     â””â”€ AdminApplicationProviders.tsx            # [COMP] i18n + AdminUi + runtime
â”œâ”€ components/
â”‚  â””â”€ layout/
â”‚     â”œâ”€ AdminShell.tsx                           # [UI] parent layout
â”‚     â”œâ”€ AdminHeader.tsx                          # [UI] child
â”‚     â”œâ”€ AdminSidebar.tsx                         # [UI] child, consumes nav view model
â”‚     â”œâ”€ AdminModuleDiagnosticAlert.tsx           # [UI] safe startup diagnostics
â”‚     â””â”€ *.css
â”œâ”€ features/
â”‚  â”œâ”€ dashboard/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ dashboardManifest.ts                  # [MANIFEST] route/nav/capabilities
â”‚  â”‚  â”‚  â””â”€ dashboardExtension.ts                 # [EXT] register reporting.read
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ ports/dashboardRepositoriesPort.ts    # [APP]
â”‚  â”‚  â”‚  â”œâ”€ presenters/dashboardPresenter.ts      # [APP]
â”‚  â”‚  â”‚  â”œâ”€ controllers/useDashboardController.ts # [HOOK]
â”‚  â”‚  â”‚  â””â”€ models/                               # Existing pure report view models
â”‚  â”‚  â”œâ”€ components/                              # [UI] cards, period, data state
â”‚  â”‚  â”œâ”€ views/                                   # [UI] sales/menu/inventory reports
â”‚  â”‚  â”œâ”€ screens/                                 # [SCREEN] overview/reports
â”‚  â”‚  â””â”€ index.ts                                 # Public manifest/extension only
â”‚  â”œâ”€ menu/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ menuManifest.ts                       # [MANIFEST]
â”‚  â”‚  â”‚  â””â”€ menuExtension.ts                      # [EXT] catalog.read/manage
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ commands/                             # Category/variant/menu commands
â”‚  â”‚  â”‚  â”œâ”€ ports/menuCatalogPort.ts
â”‚  â”‚  â”‚  â”œâ”€ presenters/                           # List/editor view models
â”‚  â”‚  â”‚  â””â”€ controllers/                          # Hooks only
â”‚  â”‚  â”œâ”€ components/                              # [UI] forms, tables, toolbar
â”‚  â”‚  â”œâ”€ views/                                   # [UI] variant list composition
â”‚  â”‚  â”œâ”€ screens/                                 # [SCREEN] list/editor/shell
â”‚  â”‚  â””â”€ index.ts
â”‚  â”œâ”€ orders/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ ordersManifest.ts
â”‚  â”‚  â”‚  â””â”€ ordersExtension.ts                    # orders.read/manage
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ commands/cancelOrderCommand.ts        # [APP] atomic cross-domain orchestration
â”‚  â”‚  â”‚  â”œâ”€ ports/
â”‚  â”‚  â”‚  â”‚  â”œâ”€ orderRepositoryPort.ts
â”‚  â”‚  â”‚  â”‚  â”œâ”€ inventoryReversalPort.ts
â”‚  â”‚  â”‚  â”‚  â””â”€ financeRefundPort.ts
â”‚  â”‚  â”‚  â”œâ”€ presenters/
â”‚  â”‚  â”‚  â””â”€ controllers/
â”‚  â”‚  â”œâ”€ components/                              # [UI] list/detail/status/totals
â”‚  â”‚  â”œâ”€ screens/                                 # [SCREEN] list/detail
â”‚  â”‚  â””â”€ index.ts
â”‚  â”œâ”€ pos/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ posManifest.ts
â”‚  â”‚  â”‚  â””â”€ posExtension.ts                       # pos.session/cart/checkout
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ commands/                             # open/close/checkout
â”‚  â”‚  â”‚  â”œâ”€ ports/                                # catalog/order/inventory/session storage
â”‚  â”‚  â”‚  â”œâ”€ presenters/
â”‚  â”‚  â”‚  â”œâ”€ controllers/
â”‚  â”‚  â”‚  â””â”€ adapters/browserPosSessionAdapter.ts  # [DATA] app-local browser adapter
â”‚  â”‚  â”œâ”€ components/                              # [UI] catalog/cart/modals/session
â”‚  â”‚  â”œâ”€ screens/PosCashierScreen.tsx
â”‚  â”‚  â””â”€ index.ts
â”‚  â”œâ”€ inventory/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ inventoryManifest.ts
â”‚  â”‚  â”‚  â””â”€ inventoryExtension.ts                 # inventory.read/adjust/reverse
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ commands/                             # movement/recipe/material commands
â”‚  â”‚  â”‚  â”œâ”€ ports/inventoryRepositoryPort.ts
â”‚  â”‚  â”‚  â”œâ”€ presenters/
â”‚  â”‚  â”‚  â””â”€ controllers/
â”‚  â”‚  â”œâ”€ components/                              # [UI] tables/dialogs
â”‚  â”‚  â”œâ”€ screens/                                 # [SCREEN] materials/movements/HPP
â”‚  â”‚  â””â”€ index.ts
â”‚  â”œâ”€ finance/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ financeManifest.ts
â”‚  â”‚  â”‚  â””â”€ financeExtension.ts                   # finance.read/record/refund
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ commands/                             # transaction/expense commands
â”‚  â”‚  â”‚  â”œâ”€ ports/financeRepositoryPort.ts
â”‚  â”‚  â”‚  â”œâ”€ presenters/
â”‚  â”‚  â”‚  â””â”€ controllers/
â”‚  â”‚  â”œâ”€ components/                              # [UI] tables/cards/dialogs
â”‚  â”‚  â”œâ”€ screens/                                 # [SCREEN] shell/overview/list/expense
â”‚  â”‚  â””â”€ index.ts
â”‚  â””â”€ settings/
â”‚     â”œâ”€ manifest/
â”‚     â”‚  â”œâ”€ settingsManifest.ts                   # Parent navigation/route contribution
â”‚     â”‚  â””â”€ settingsExtension.ts
â”‚     â”œâ”€ screens/SettingsScreen.tsx               # [SCREEN] outlet for child modules
â”‚     â”œâ”€ theme/
â”‚     â”‚  â”œâ”€ manifest/themeManifest.ts
â”‚     â”‚  â”œâ”€ manifest/themeExtension.ts
â”‚     â”‚  â”œâ”€ application/                          # Theme storage/presenter/controller
â”‚     â”‚  â”œâ”€ components/                           # [UI] controls/editor/preview
â”‚     â”‚  â””â”€ screens/ThemeSettingsScreen.tsx
â”‚     â”œâ”€ business-hours/
â”‚     â”‚  â”œâ”€ manifest/businessHoursManifest.ts
â”‚     â”‚  â”œâ”€ manifest/businessHoursExtension.ts
â”‚     â”‚  â”œâ”€ application/                          # Model/port/controller
â”‚     â”‚  â”œâ”€ components/                           # [UI] outlet/schedule
â”‚     â”‚  â””â”€ screens/BusinessHoursScreen.tsx
â”‚     â””â”€ index.ts
â”œâ”€ screens/
â”‚  â””â”€ AdminNotFoundScreen.tsx                     # [SCREEN] app-wide only
â””â”€ tests/
   â”œâ”€ adminModuleDiscovery.test.ts                # [TEST]
   â”œâ”€ adminRouteContributions.test.tsx            # [TEST]
   â”œâ”€ adminNavigationContributions.test.ts        # [TEST]
   â””â”€ adminImportBoundary.test.ts                 # [TEST]
```

## 5. Storefront Customer Runtime Target

```text
apps/storefront/src/
â”œâ”€ main.tsx                                       # [BOOT]
â”œâ”€ App.tsx                                        # [COMP]
â”œâ”€ app/
â”‚  â”œâ”€ composition/
â”‚  â”‚  â”œâ”€ createStorefrontRuntime.ts               # [COMP]
â”‚  â”‚  â”œâ”€ createStorefrontRepositories.ts          # [COMP]
â”‚  â”‚  â”œâ”€ createStorefrontStorageAdapters.ts       # [COMP]
â”‚  â”‚  â”œâ”€ storefrontRuntime.ts                     # [APP]
â”‚  â”‚  â””â”€ StorefrontRuntimeProvider.tsx            # [HOOK]
â”‚  â”œâ”€ discovery/
â”‚  â”‚  â”œâ”€ storefrontModuleCandidates.ts            # [COMP]
â”‚  â”‚  â””â”€ discoverStorefrontModules.ts             # [APP]
â”‚  â”œâ”€ routing/
â”‚  â”‚  â”œâ”€ StorefrontRouter.tsx                     # [UI] BrowserRouter adapter
â”‚  â”‚  â”œâ”€ StorefrontRoutes.tsx                     # [UI]
â”‚  â”‚  â”œâ”€ resolveStorefrontRoutes.ts               # [APP]
â”‚  â”‚  â””â”€ storefrontRouteComponentRegistry.ts      # [COMP]
â”‚  â””â”€ providers/
â”‚     â””â”€ StorefrontApplicationProviders.tsx       # [COMP] i18n/theme/cart/runtime
â”œâ”€ components/
â”‚  â””â”€ layout/
â”‚     â”œâ”€ StorefrontShell.tsx                      # [UI] parent
â”‚     â”œâ”€ StorefrontHeader.tsx                     # [UI] child
â”‚     â””â”€ StorefrontShell.module.css
â”œâ”€ features/
â”‚  â”œâ”€ catalog/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ catalogManifest.ts
â”‚  â”‚  â”‚  â””â”€ catalogExtension.ts                   # catalog.read/configure
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ commands/                             # Add/configure intent, no JSX
â”‚  â”‚  â”‚  â”œâ”€ ports/storefrontCatalogPort.ts
â”‚  â”‚  â”‚  â”œâ”€ presenters/                           # Catalog/detail view models
â”‚  â”‚  â”‚  â”œâ”€ models/                               # Search/filter/detail pure logic
â”‚  â”‚  â”‚  â””â”€ controllers/                          # useCatalog/useMenuDetail
â”‚  â”‚  â”œâ”€ components/                              # [UI] hero/tabs/grid/card/detail
â”‚  â”‚  â”œâ”€ screens/                                 # [SCREEN] catalog/menu detail
â”‚  â”‚  â””â”€ index.ts
â”‚  â”œâ”€ cart/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ cartManifest.ts
â”‚  â”‚  â”‚  â””â”€ cartExtension.ts                      # cart.read/manage
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ commands/                             # add/edit/remove/clear
â”‚  â”‚  â”‚  â”œâ”€ ports/cartStoragePort.ts
â”‚  â”‚  â”‚  â”œâ”€ adapters/browserCartStorageAdapter.ts # [DATA] localStorage boundary
â”‚  â”‚  â”‚  â”œâ”€ models/                               # Validation/totals
â”‚  â”‚  â”‚  â””â”€ controllers/                          # Provider/hook bridges
â”‚  â”‚  â”œâ”€ components/                              # [UI] item/list/summary
â”‚  â”‚  â”œâ”€ screens/CartScreen.tsx
â”‚  â”‚  â””â”€ index.ts
â”‚  â”œâ”€ checkout/
â”‚  â”‚  â”œâ”€ manifest/
â”‚  â”‚  â”‚  â”œâ”€ checkoutManifest.ts
â”‚  â”‚  â”‚  â””â”€ checkoutExtension.ts                  # checkout.submit
â”‚  â”‚  â”œâ”€ application/
â”‚  â”‚  â”‚  â”œâ”€ commands/createStorefrontOrderCommand.ts
â”‚  â”‚  â”‚  â”œâ”€ ports/checkoutOrderPort.ts
â”‚  â”‚  â”‚  â”œâ”€ presenters/checkoutPresenter.ts
â”‚  â”‚  â”‚  â””â”€ controllers/useCheckoutController.ts
â”‚  â”‚  â”œâ”€ components/                              # [UI] form sections/sticky action
â”‚  â”‚  â”œâ”€ screens/CheckoutScreen.tsx
â”‚  â”‚  â””â”€ index.ts
â”‚  â””â”€ order-confirmation/
â”‚     â”œâ”€ manifest/
â”‚     â”‚  â”œâ”€ orderConfirmationManifest.ts
â”‚     â”‚  â””â”€ orderConfirmationExtension.ts         # storefront.order.read-recent
â”‚     â”œâ”€ application/
â”‚     â”‚  â”œâ”€ ports/recentOrderReceiptStoragePort.ts
â”‚     â”‚  â”œâ”€ adapters/browserRecentOrderReceiptAdapter.ts
â”‚     â”‚  â”œâ”€ presenters/orderConfirmationPresenter.ts
â”‚     â”‚  â””â”€ controllers/useOrderConfirmationController.ts
â”‚     â”œâ”€ components/                              # [UI] result/status/items/totals/actions
â”‚     â”œâ”€ screens/OrderConfirmationScreen.tsx
â”‚     â””â”€ index.ts
â”œâ”€ screens/
â”‚  â””â”€ StorefrontNotFoundScreen.tsx
â”œâ”€ styles/global.css
â””â”€ tests/
   â”œâ”€ storefrontModuleDiscovery.test.ts
   â”œâ”€ storefrontRouteContributions.test.tsx
   â””â”€ storefrontImportBoundary.test.ts
```

Storefront `cart`, `checkout`, dan `order-confirmation` adalah sibling modules. Mereka
tidak boleh mengimpor internal file satu sama lain. Koordinasi dilakukan melalui
capability atau public application contract yang didaftarkan.

## 6. Existing Business Packages Target

```text
packages/domain/src/
â”œâ”€ catalog/        # [DOMAIN] types, validation, variant selection
â”œâ”€ orders/         # [DOMAIN] types and transitions
â”œâ”€ pos/            # [DOMAIN] session, pricing, cart, checkout
â”œâ”€ inventory/      # [DOMAIN] types, units, stock, HPP
â”œâ”€ finance/        # [DOMAIN] types, validation, ledger, calculations
â”œâ”€ reporting/      # [DOMAIN] dashboard and reports
â””â”€ index.ts

packages/data/src/
â”œâ”€ repositories/   # [DATA] capability-neutral repository contracts
â”œâ”€ mocks/          # [DATA] in-memory adapters and fixtures
â”œâ”€ adapters/       # [DATA] future HTTP/persistence adapters; not created speculatively
â””â”€ index.ts

packages/i18n/src/
â”œâ”€ translations.ts # [I18N] ID/EN keys
â”œâ”€ formatters.ts   # [I18N] stable Rupiah formatting
â”œâ”€ preferences.ts
â”œâ”€ WarungMengI18nProvider.tsx
â””â”€ index.ts
```

Module manifest hanya mereferensikan translation key. Business names dan Rupiah
formatting tetap milik data/domain/i18n, bukan manifest.

## 7. Parentâ€“Child Contract

```text
Workspace
â”œâ”€ Shared headless packages
â”œâ”€ Admin surface
â”‚  â”œâ”€ Composition root
â”‚  â”‚  â”œâ”€ Module registry
â”‚  â”‚  â”œâ”€ Capability registry
â”‚  â”‚  â”œâ”€ Concrete adapters
â”‚  â”‚  â””â”€ Router/UI resolvers
â”‚  â”œâ”€ Admin shell
â”‚  â”‚  â”œâ”€ Header
â”‚  â”‚  â”œâ”€ Sidebar
â”‚  â”‚  â””â”€ Resolved route outlet
â”‚  â””â”€ Feature module
â”‚     â”œâ”€ Manifest
â”‚     â”œâ”€ Extension
â”‚     â”œâ”€ Application controller
â”‚     â””â”€ Screen
â”‚        â”œâ”€ View
â”‚        â””â”€ Presentational components
â””â”€ Storefront surface
   â””â”€ hierarchy yang sama dengan registry terpisah
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

## 8. UIâ€“Logicâ€“Data Contract

```text
User event
  â†’ [UI] component callback
  â†’ [SCREEN/HOOK] controller command
  â†’ [APP] headless command/policy
  â†’ [DOMAIN] validation/calculation
  â†’ [APP] port
  â†’ [DATA] adapter/repository
  â†’ [APP] normalized result + presenter
  â†’ [HOOK] React state bridge
  â†’ [UI] render
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
apps/*/app â†’ feature public entry
feature manifest â†’ module-system contracts + i18n key types
feature extension â†’ module-system contracts + feature application public contract
feature screen â†’ same-feature application/components
feature application â†’ domain + repository/capability ports
data â†’ domain
ui-admin/ui-storefront â†’ React/AntD and their own public contracts
```

Forbidden:

```text
admin â†’ storefront
storefront â†’ admin
domain â†’ data/app/UI/module runtime
component â†’ repository/concrete adapter/manifest registry
manifest â†’ React/AntD/screen/concrete adapter
feature A â†’ feature B internal path
shared package â†’ apps/*
module-system â†’ Warung Meng business domain or React
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
manifest â†’ extension â†’ capability â†’ existing logic â†’ existing UI â†’ existing route
```

Setelah parity:

```text
existing logic/UI dipindahkan ke target owner â†’ legacy import dihapus â†’ ledger verified
```
