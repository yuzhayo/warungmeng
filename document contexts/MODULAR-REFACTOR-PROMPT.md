# Warung Meng Plug-and-Play Modular Refactor Prompt

## Plug-and-Play Modular Control Center Architecture

Gunakan prompt ini untuk merombak arsitektur Warung Meng secara bertahap menjadi:

> **Plug-and-Play Modular Control Center Architecture**  
> _Declarative UI, Headless Logic Engine, Manifest Discovery, and Stable Extension Contracts._

Prompt ini khusus untuk repository:

```text
C:\VSCODE\AntD\warungmeng
```

Snapshot saat prompt disesuaikan:

- tanggal: 24 Juli 2026;
- branch: `main`;
- baseline teramati: `09ad95a`;
- package manager: npm workspaces;
- stack: React 19, React Router 7, Vite 8, TypeScript 6, Ant Design 6, dan Vitest 4;
- mode data saat ini: frontend-first dan mock repository;
- aplikasi: Admin pada port 3000 dan Storefront pada port 3001.

Baseline tersebut hanya snapshot. Agent wajib memeriksa ulang branch, commit, status,
dependency, route, dan file aktual sebelum membuat plan atau perubahan.

---

# Refactor Mission

Rombak Warung Meng tanpa big-bang rewrite sehingga fitur operasional dapat ditemukan,
didaftarkan, dirakit, diaktifkan, diuji, dan dikembangkan melalui kontrak modul yang
stabil.

File tree target, ownership UI/application/domain/data, dan parentâ€“child contract
canonical untuk refactor ini berada di:

```text
TARGET-FILE-TREE.md
```

Empat fondasi target tidak boleh dikurangi:

1. **Declarative UI** â€” navigasi, route, action, tab, dan metadata presentasi berasal
   dari kontribusi modul yang deklaratif.
2. **Headless Logic Engine** â€” business rule dan orchestration utama dapat berjalan
   tanpa React, DOM, router, CSS, atau Ant Design.
3. **Manifest Discovery** â€” modul dikenali melalui manifest tervalidasi, bukan daftar
   fitur yang tersebar di shell, route, dan UI.
4. **Stable Extension Contracts** â€” modul menambah capability melalui public contract,
   bukan dengan mengimpor internal implementation modul lain.

Target ini bukan izin untuk mengubah business behavior, persistence, backend, payment,
auth, hardware, atau dependency secara diam-diam.

## 1. Operating Mode

Mulai selalu dalam mode **audit read-only**.

Input eksekusi yang harus ditentukan atau ditemukan:

- target surface: `admin`, `storefront`, `shared`, atau kombinasi eksplisit;
- target module;
- phase aktif;
- baseline commit;
- allowed files;
- forbidden files;
- required validation;
- apakah approval diperlukan setelah setiap phase.

Jika scope hanya menyebut â€œrefactor Warung Mengâ€, audit seluruh monorepo tetapi jangan
mengubah production source. Buat execution plan canonical dan usulkan phase pertama.

## 2. Source of Truth

Baca sumber berikut sebelum bekerja, sesuai urutan:

1. instruksi user untuk turn aktif;
2. `CLAUDE.md`;
3. `AGENTS.md` terdekat dengan target;
4. source code, tests, package manifest, dan configuration aktual;
5. `PRD.md`;
6. phase plan dan QA report yang masih aktif;
7. technical-debt register;
8. dokumen lama hanya sebagai historical context.

Khusus Storefront, baca:

```text
apps/storefront/AGENTS.md
.docs/STOREFRONT-PLAN-INDEX.md
.docs/STOREFRONT-MVP-QA-REPORT.md
PRD.md
```

`apps/storefront/PLAN.md` mengandung keputusan lama seperti outlet-scoped route dan
AntD Mobile. Jangan menganggapnya canonical jika bertentangan dengan route, dependency,
atau plan index aktual.

Jika dua sumber masih aktif tetapi bertentangan:

1. catat konflik dengan file dan baris;
2. tentukan apakah code aktual atau product decision yang harus dipertahankan;
3. jangan menyelesaikan keputusan material dengan asumsi;
4. minta keputusan user jika konflik memengaruhi public contract atau arsitektur target.

## 3. Current Repository Map

```text
warungmeng/
â”œâ”€ apps/
â”‚  â”œâ”€ admin/
â”‚  â”‚  â””â”€ src/
â”‚  â”‚     â”œâ”€ app/
â”‚  â”‚     â”œâ”€ components/layout/
â”‚  â”‚     â””â”€ features/
â”‚  â”‚        â”œâ”€ dashboard/
â”‚  â”‚        â”œâ”€ menu/
â”‚  â”‚        â”œâ”€ orders/
â”‚  â”‚        â”œâ”€ pos/
â”‚  â”‚        â”œâ”€ inventory/
â”‚  â”‚        â”œâ”€ finance/
â”‚  â”‚        â””â”€ settings/
â”‚  â””â”€ storefront/
â”‚     â””â”€ src/
â”‚        â”œâ”€ app/
â”‚        â”œâ”€ components/layout/
â”‚        â””â”€ features/
â”‚           â”œâ”€ catalog/
â”‚           â”œâ”€ cart/
â”‚           â”œâ”€ checkout/
â”‚           â””â”€ orders/
â””â”€ packages/
   â”œâ”€ config/
   â”œâ”€ domain/
   â”œâ”€ data/
   â”œâ”€ i18n/
   â”œâ”€ ui-admin/
   â””â”€ ui-storefront/
```

Current application routes:

### Admin

- `/` â€” Dashboard overview;
- `/reports` â€” Dashboard reports;
- `/menu` dan editor/variant children;
- `/orders` dan `/orders/:orderId`;
- `/pos`;
- `/inventory`, `/inventory/movements`, `/inventory/hpp`;
- `/finance/overview`, `/finance/transactions`, `/finance/expenses`;
- `/settings/theme`, `/settings/business-hours`.

Admin menggunakan `HashRouter`.

### Storefront

- `/` â€” catalog;
- `/menu/:menuSlug` â€” menu detail;
- `/cart`;
- `/checkout`;
- `/orders/:orderId` â€” recent order confirmation;
- `*` â€” not found.

Storefront menggunakan `BrowserRouter`, route-level lazy loading, dan single outlet
`wm-1`. Jangan membuat outlet chooser atau outlet-scoped URL tanpa keputusan baru.

## 4. Current Shared Contracts

Pertahankan ownership berikut:

| Package                     | Ownership                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| `@warungmeng/domain`        | Pure types, validation, transition, pricing, stock, HPP, finance, POS, dan reporting rules        |
| `@warungmeng/data`          | Repository interfaces, in-memory adapters, dan Warung Meng fixtures                               |
| `@warungmeng/i18n`          | ID/EN translations, provider, preference, dan Rupiah formatter                                    |
| `@warungmeng/ui-admin`      | Admin theme/provider dan reusable admin UI contracts                                              |
| `@warungmeng/ui-storefront` | Reusable storefront UI jika reuse lintas feature sudah nyata; saat ini public export masih kosong |
| `@warungmeng/config`        | Shared configuration yang benar-benar dipakai                                                     |

Aturan keras:

- `packages/domain` tidak mengimpor React, AntD, app, data adapter, browser API, atau
  storage.
- `packages/data` boleh bergantung pada domain, tetapi tidak pada app atau UI.
- `apps/admin` dan `apps/storefront` tidak boleh saling mengimpor.
- Storefront tidak boleh mengimpor `@warungmeng/ui-admin`.
- Shared package tidak boleh mengimpor source aplikasi.
- Jangan memindahkan screen-specific UI ke shared package.

## 5. Target Modular Architecture

Target bukan satu runtime global yang mencampur Admin dan Storefront. Gunakan dua
composition root dan dua registry surface:

```text
Warung Meng shared contracts
â”œâ”€ Admin Control Center
â”‚  â”œâ”€ admin module registry
â”‚  â””â”€ admin composition root
â””â”€ Storefront Customer Runtime
   â”œâ”€ storefront module registry
   â””â”€ storefront composition root
```

Kontrak dasar modul boleh dibagikan. Route, UI contribution, capability, dan lifecycle
harus dibatasi oleh surface.

### Admin modules

- dashboard;
- menu;
- orders;
- pos;
- inventory;
- finance;
- settings-theme;
- settings-business-hours.

### Storefront modules

- catalog;
- cart;
- checkout;
- order-confirmation.

Modul Admin tidak otomatis dapat dipasang pada Storefront, dan sebaliknya.

## 6. Declarative UI Contract

Pindahkan static UI metadata yang sekarang tersebar di navigation, routes, tabs, dan
toolbar menjadi kontribusi deklaratif milik modul.

Contoh target contract:

```ts
export type WarungMengSurface = "admin" | "storefront";

export interface ModuleNavigationContribution {
  readonly id: string;
  readonly labelKey: string;
  readonly order: number;
  readonly path: string;
  readonly iconId?: string;
  readonly parentId?: string;
}

export interface ModuleRouteContribution {
  readonly id: string;
  readonly path: string;
  readonly parentRouteId?: string;
  readonly load: () => Promise<{ default: React.ComponentType }>;
}

export interface ModuleActionContribution {
  readonly id: string;
  readonly labelKey: string;
  readonly placement: string;
  readonly order: number;
  readonly requiredCapability?: string;
}
```

Contract final harus menghindari React type jika contract tersebut perlu dipakai oleh
headless package. Dalam kasus itu, pisahkan route metadata murni dari React route
resolver milik app.

Ketentuan:

1. Stable ID tidak bergantung pada label ID/EN.
2. Label user-facing menggunakan translation key.
3. Icon concrete dipetakan di UI adapter, bukan di headless manifest.
4. Manifest tidak menyimpan mutable runtime state.
5. Dynamic availability berasal dari policy/view model, bukan static definition.
6. Satu action ID hanya mempunyai satu owner.
7. Duplicate route, navigation, action, atau tab ID menghasilkan diagnostic.
8. Urutan UI deterministik.

Contoh stable ID:

```text
admin.dashboard
admin.menu
admin.orders
admin.pos
admin.inventory
admin.finance
admin.settings.theme
admin.settings.business-hours

storefront.catalog
storefront.cart
storefront.checkout
storefront.order-confirmation

order.cancel
pos.session.open
pos.session.close
inventory.movement.create
finance.expense.create
catalog.menu.add-to-cart
```

## 7. Headless Logic Engine

Headless tidak berarti membuat satu manager monolitik. Setiap domain atau feature
memiliki engine/application service kecil dengan ownership yang jelas.

Engine boleh memiliki:

- command orchestration;
- policy evaluation;
- deterministic calculations;
- repository coordination;
- async lifecycle;
- cancellation dan stale-response protection;
- normalized errors;
- view-model/presenter transformation;
- idempotency guard yang sudah disetujui contract-nya.

Engine dilarang mengimpor:

- React hooks atau components;
- React Router;
- Ant Design;
- CSS;
- `window`, `document`, `localStorage`, atau `sessionStorage` secara langsung;
- concrete in-memory atau HTTP repository.

Browser storage harus masuk melalui port kecil atau app adapter. React hook hanya
menjembatani engine/application service dengan render lifecycle.

Business invariants yang wajib dipertahankan:

- Rupiah memakai separator Indonesia pada locale ID maupun EN;
- single outlet tetap `wm-1`;
- invalid order transition ditolak;
- pembatalan paid order membuat Finance refund dan Inventory reversal secara atomik
  dan idempotent;
- unpaid cancellation tidak membuat refund/reversal;
- POS pricing dan cart calculation tetap deterministik;
- HPP berasal dari recipe dan inventory cost;
- menu/category/variant visibility dan selection rule tetap menggunakan shared domain;
- mock-first tidak boleh diklaim sebagai backend persistence.

## 8. Manifest Discovery

Discovery awal harus kompatibel dengan Vite dan browser runtime. Jangan membuat
filesystem scanning atau remote-code loading di browser.

Gunakan dua tahap:

1. build-time module candidates melalui explicit imports atau `import.meta.glob`;
2. runtime validation dan deterministic registration dari manifest candidates.

Contoh manifest:

```ts
export interface WarungMengModuleManifest {
  readonly id: string;
  readonly version: 1;
  readonly surface: WarungMengSurface;
  readonly displayNameKey: string;
  readonly dependsOn?: readonly string[];
  readonly capabilities?: readonly string[];
  readonly navigation?: readonly ModuleNavigationContribution[];
  readonly actions?: readonly ModuleActionContribution[];
}
```

Discovery wajib membedakan:

- valid;
- malformed;
- duplicate ID;
- wrong surface;
- unsupported manifest version;
- missing dependency;
- dependency cycle;
- unavailable optional capability;
- registration failure.

Satu manifest invalid tidak boleh menjatuhkan seluruh application shell. Required core
module yang gagal boleh memblokir startup dengan error yang eksplisit dan aman.

Remote plugin download, arbitrary JavaScript execution, package installation, dan
third-party marketplace bukan scope fase awal.

## 9. Stable Extension Contract

Extension hanya menerima capability tingkat tinggi.

```ts
export interface WarungMengExtensionContext {
  readonly surface: WarungMengSurface;
  readonly capabilities: CapabilityRegistry;
  readonly diagnostics: ModuleDiagnosticSink;
}

export interface WarungMengExtension {
  readonly manifest: WarungMengModuleManifest;
  register(context: WarungMengExtensionContext): void | Promise<void>;
}
```

Jangan memberikan raw mutable repository registry kepada semua extension. Expose
capability terkecil yang diperlukan, misalnya:

```text
catalog.read
catalog.manage
orders.read
orders.manage
inventory.read
inventory.adjust
finance.read
finance.record
reporting.read
cart.manage
checkout.submit
```

Ketentuan:

1. Extension tidak mengimpor internal extension lain.
2. Cross-feature workflow menggunakan shared domain contract atau registered
   capability.
3. Capability lookup gagal secara eksplisit.
4. Optional capability menghasilkan degraded state yang terdefinisi.
5. Registration deterministik dan dapat diuji tanpa UI.
6. Extension teardown/disposal ditambahkan jika extension memiliki subscription atau
   async lifecycle.
7. Contract versioning hanya ditambah ketika compatibility need nyata.

## 10. Composition Roots

Composition root aktual harus berkembang dari:

```text
apps/admin/src/App.tsx
apps/admin/src/app/AppRoutes.tsx

apps/storefront/src/App.tsx
apps/storefront/src/app/ApplicationProviders.tsx
apps/storefront/src/app/AppRoutes.tsx
```

Target:

```text
apps/admin/src/app/
â”œâ”€ createAdminRuntime.ts
â”œâ”€ adminModuleRegistry.ts
â”œâ”€ AdminApplicationProviders.tsx
â””â”€ AppRoutes.tsx

apps/storefront/src/app/
â”œâ”€ createStorefrontRuntime.ts
â”œâ”€ storefrontModuleRegistry.ts
â”œâ”€ ApplicationProviders.tsx
â””â”€ AppRoutes.tsx
```

Hanya composition root yang mengetahui:

- concrete repository adapter;
- storage adapter;
- module candidate list;
- module registry implementation;
- capability bindings;
- router/UI resolver;
- environment-specific configuration.

`main.tsx` tetap bootstrap-only. `App.tsx` tetap composition-only.

## 11. Dependency Direction

```text
Manifest metadata
        â†“
Module registry and capability contracts
        â†“
App composition root
        â†“
Route/screen controllers
        â†“
Feature application services and presenters
        â†“
Shared domain rules and repository contracts
        â†‘
Concrete data/storage adapters

Presentational UI:
receives view model + callbacks; never owns repositories
```

Forbidden imports:

- app A â†’ app B;
- domain â†’ data/UI/app;
- UI component â†’ repository or concrete adapter;
- extension â†’ internal extension;
- manifest â†’ screen implementation;
- feature child â†’ routed screen parent;
- shared package â†’ application source.

Automated boundary test harus menggunakan resolver dan tsconfig production aktual.

## 12. Target Feature Shape

Jangan memindahkan semua file hanya agar cocok dengan diagram. Migrasikan berdasarkan
ownership dan kebutuhan phase.

```text
apps/<surface>/src/features/<feature>/
â”œâ”€ manifest/
â”‚  â”œâ”€ <feature>Manifest.ts
â”‚  â””â”€ <feature>Extension.ts
â”œâ”€ application/
â”‚  â”œâ”€ commands/
â”‚  â”œâ”€ presenters/
â”‚  â”œâ”€ ports/
â”‚  â””â”€ controllers/
â”œâ”€ components/
â”œâ”€ screens/
â”œâ”€ views/
â””â”€ index.ts
```

Pure business rule lintas aplikasi tetap berada di `packages/domain`, bukan
`apps/*/features/*/domain`.

Public `index.ts` feature hanya mengekspor manifest/extension entry dan contract yang
memang boleh dipakai composition root. Jangan mengekspor seluruh internal feature.

## 13. Naming Contract

- React component dan file: `PascalCase`.
- Hook: prefix `use`.
- Factory: prefix `create`.
- Command: verb + object, contoh `cancelOrderCommand.ts`.
- Presenter: suffix `Presenter`.
- View model type: suffix `ViewModel`.
- Port: capability + `Port`.
- Concrete adapter: mechanism + capability + `Adapter`.
- Manifest: `<feature>Manifest.ts`.
- Extension: `<feature>Extension.ts`.
- Registry: `<surface>ModuleRegistry.ts`.
- Stable module ID: namespaced lowercase dot notation.

Hindari nama baru seperti:

```text
utils.ts
helpers.ts
common.ts
misc.ts
manager.ts
engine.ts
service.ts
```

Nama tersebut hanya boleh dipakai jika responsibility dan owner benar-benar jelas.

## 14. Existing Behavior Protection

Sebelum memindahkan production code:

1. petakan route, screen, provider, repository instance, storage, dan cross-feature
   import;
2. jalankan baseline validation;
3. catat kegagalan existing;
4. tambahkan characterization test untuk behavior penting yang belum terlindungi;
5. buktikan test gagal jika behavior yang diklaim dilindungi dihapus;
6. buat migration map;
7. pisahkan rename/move dari perubahan behavior;
8. jangan menyentuh source sebelum phase plan disetujui.

Characterization minimum:

- loading, success, empty, error, retry, dan not-found;
- route dan deep link;
- navigation ID/EN;
- Rupiah formatting;
- valid dan invalid order transitions;
- paid/unpaid cancellation effects;
- POS session/cart/checkout;
- inventory movement dan HPP;
- finance aggregation;
- catalog/category/search/menu detail;
- cart persistence;
- checkout submission lock;
- recent-order session receipt;
- responsive and keyboard behavior untuk UI yang dipindahkan.

## 15. Migration Map Seed

Audit harus memperbaiki tabel ini berdasarkan evidence:

| Current owner                            | Target owner                                 | Intended change                                            |
| ---------------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| `apps/admin/src/app/navigation.tsx`      | Admin module manifests + navigation resolver | Pindahkan static navigation metadata secara bertahap       |
| `apps/admin/src/app/AppRoutes.tsx`       | Route contributions + admin route resolver   | Pertahankan route dan lazy/eager behavior                  |
| `apps/admin/src/features/*`              | Feature-owned admin extensions               | Tambahkan manifest entry tanpa rewrite feature logic       |
| `apps/storefront/src/app/AppRoutes.tsx`  | Storefront route contributions + resolver    | Pertahankan public URL dan lazy loading                    |
| `apps/storefront/src/features/*`         | Feature-owned storefront extensions          | Daftarkan capability/route secara bertahap                 |
| App-local concrete repository singletons | Surface composition root                     | Pindahkan creation/wiring, bukan contract atau behavior    |
| Cross-feature direct internal imports    | Capability atau public feature contract      | Migrasikan hanya jika boundary terbukti bermasalah         |
| Existing hooks/models                    | Headless application services where valuable | Jangan mengekstrak React-free layer tanpa testable benefit |

## 16. Phased Refactor Strategy

### Phase 00 â€” Baseline and architecture audit

- read-only;
- inventory module, route, navigation, state owner, repository, storage, tests;
- identify stale docs and boundary violations;
- capture validation baseline;
- create canonical execution plan.

Stop: report readiness. Jangan edit production source.

### Phase 01 â€” Module contracts

- define manifest, diagnostic, capability, extension, dan registry contracts;
- add pure validation and dependency-resolution tests;
- no UI migration;
- no behavior change.

Stop: contract review.

### Phase 02 â€” Admin registry skeleton

- create Admin composition runtime;
- register existing features through compatibility extensions;
- preserve current navigation and routes;
- migrate one low-risk module first, recommended Dashboard.

Stop: automated validation + browser QA + review.

### Phase 03 â€” Declarative Admin navigation and routes

- migrate navigation/route metadata module by module;
- detect duplicate IDs/routes;
- remove legacy list only after every consumer migrates.

### Phase 04 â€” Admin headless capability boundaries

- migrate orchestration by feature;
- prioritize Orders cancellation, POS, Inventory, dan Finance due to cross-domain
  effects;
- preserve atomicity and idempotency.

### Phase 05 â€” Storefront registry skeleton

- separate Storefront registry and composition root;
- preserve current public routes;
- migrate Catalog first, then Cart, Checkout, dan Order Confirmation.

### Phase 06 â€” Stable cross-feature capabilities

- replace proven problematic internal imports with public capability contracts;
- do not convert every function into a capability;
- keep synchronous pure domain logic as direct domain imports.

### Phase 07 â€” Boundary enforcement and legacy removal

- enable production import-boundary checks;
- remove compatibility paths with no consumers;
- verify no duplicate source of truth.

### Phase 08 â€” Full regression and architecture closure

- full automated gate;
- Admin and Storefront browser QA;
- update canonical roadmap, execution evidence, dan debt;
- report remaining backend/persistence work separately.

Setiap phase wajib mempunyai allowlist file, success criteria, fallback, rollback/remediation,
evidence path, dan stop condition.

## 17. Guardrails

Dilarang:

- big-bang rewrite;
- mengubah domain/data contract tanpa explicit approval;
- menambah dependency tanpa approval;
- memasukkan backend, database, payment, auth, deployment, atau hardware ke phase
  refactor frontend;
- membuat remote plugin execution;
- mencampur Admin dan Storefront registry;
- membuat global mutable service locator;
- membuat manifest kedua untuk data yang sudah dimiliki domain;
- memindahkan business rule ke manifest;
- membuat extension wrapper permanen tanpa removal plan;
- mengubah route, locale behavior, Rupiah, atau single-outlet decision diam-diam;
- memformat file di luar scope;
- menghapus test agar gate lulus;
- menonaktifkan lint rule;
- commit atau push tanpa instruksi;
- memakai reset, clean, atau forced checkout;
- mengklaim visual PASS tanpa browser evidence.

## 18. Canonical Execution Plan Template

Setiap phase plan wajib berisi:

```text
Phase ID:
Status: PENDING | IN_PROGRESS | PASS | BLOCKED
Objective:
Surface:
Module owner:
Baseline:
Preconditions:
Allowed files:
Forbidden files:
Current behavior:
Target contract:
Migration map:
Compatibility path:
Tests to add:
Validation commands:
Browser scenarios:
Success criteria:
Fallback:
Remediation/rollback:
Stop condition:
Evidence path:
Next-agent handoff:
```

Fallback tidak boleh digunakan untuk menandai `PASS` ketika success criteria gagal.

## 19. Validation

Temukan script aktual sebelum menjalankan. Baseline repository saat prompt dibuat:

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test -- --maxWorkers=2
npm run build
npx -y @ant-design/cli lint apps/admin/src --format json
npx -y @ant-design/cli lint apps/storefront/src --format json
git diff --check
```

Untuk change sempit, jalankan test target dan workspace typecheck/build lebih dahulu.
Jika shared package, module contract, app composition root, route contract, atau public
behavior berubah, jalankan full monorepo gate.

Material UI change membutuhkan browser QA. Minimum:

- Admin desktop dan narrow/mobile layout yang relevan;
- Storefront `320x800`, `375x812`, `430x932`, `768x1024`, `1024x768`, dan desktop;
- keyboard, visible focus, navigation, loading, empty, error, disabled, not-found;
- horizontal overflow;
- console errors;
- critical flow yang tersentuh.

Jika browser tidak tersedia, status visual adalah `PARTIAL`, bukan `PASS`.

## 20. Required Handoff

Gunakan format:

### Verdict

`PASS`, `PARTIAL`, `FAIL`, atau `BLOCKED`.

### Findings

Urutkan `Critical`, `High`, `Medium`, lalu `Low/technical debt`. Setiap finding memuat:

- file dan lokasi;
- evidence;
- impact;
- minimal remediation;
- confirmed defect, code-derived risk, atau unverified visual concern.

### Architecture Outcome

- module/extension boundary;
- ownership sebelum dan sesudah;
- manifest/capability contract;
- public behavior yang dipertahankan;
- compatibility path dan removal phase;
- legacy source of truth tersisa.

### Changed Files

Pisahkan created, modified, moved, dan deleted.

### Validation

Cantumkan command aktual, hasil, warning, dan blocker.

### Browser QA

Cantumkan viewport, interaction, result, dan evidence. Jika tidak dilakukan, tulis
secara eksplisit.

### Remaining Work

Cantumkan deferred phase, debt, risiko, dan keputusan user yang diperlukan.

### Git Safety

Cantumkan final `git status` dan konfirmasi tidak melakukan reset, clean, forced
checkout, commit, atau push tanpa instruksi.

---

# Agent Kickoff

Lakukan hanya Phase 00:

1. Audit repository secara read-only.
2. Verifikasi snapshot, instructions, routes, package boundaries, tests, storage, dan
   repository wiring.
3. Petakan current modules untuk Admin dan Storefront.
4. Petakan navigation, routes, actions, tabs, capability, dan cross-feature workflow.
5. Identifikasi calon Declarative UI definitions.
6. Identifikasi logic yang benar-benar perlu menjadi headless.
7. Rancang manifest discovery yang kompatibel dengan Vite tanpa remote code execution.
8. Rancang stable extension/capability contract tanpa mengubah domain behavior.
9. Buat migration map dan canonical execution plan.
10. Laporkan readiness dan blocker untuk Phase 01.

Jangan mengubah production source pada Phase 00. Jangan menganggap hasil validasi agent
sebelumnya sebagai verifikasi baru. Jangan memulai Phase 01 sebelum Phase 00 dilaporkan
dan disetujui.
