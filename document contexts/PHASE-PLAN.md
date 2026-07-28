# Warung Meng — Canonical Execution Plan (Phase 01–05)

Status: **CANONICAL — EXECUTION REQUIRES PER-PHASE APPROVAL**  
Prepared: 26 Juli 2026  
Planning checkout: `main` at `00ad766`  
Latest production-source baseline recorded by Phase 00: `09ad95a`

Dokumen ini adalah execution plan canonical untuk Phase 01–05. Keberadaannya tidak
memberi izin mengeksekusi phase, mengedit production source, mengubah dependency,
commit, atau push tanpa approval yang diwajibkan setiap phase.

## 0. Phase 00 Closure Input

Phase 00 dinyatakan selesai oleh user dan **tidak boleh diulang**:

- ledger 361 file sama dengan 361 file pada scope audit, 1:1;
- baseline: 92 test files / 581 tests PASS;
- lint, typecheck, dan build PASS;
- audit enam dimensi selesai;
- cross-feature map: 10 Admin dan 9 Storefront;
- dua characterization gap yang wajib ditutup pada phase pemiliknya:
  - navigation ID/EN transitive behavior — sebelum cutover Phase 03;
  - checkout submission lock — sebelum Checkout sub-wave Phase 05;
- `/calculator` redirect dan catch-all `* → /` sudah dinilai sebagai delta snapshot,
  bukan defect;
- tidak ada production-source edit pada Phase 00.

Phase executor hanya melakukan **drift preflight**, bukan audit ulang. Jika source,
route, contract, atau dependency berubah setelah baseline, phase berstatus `BLOCKED`
sampai delta tersebut dipetakan ke ledger dan disetujui.

## 1. Authority, Roles, and Approval

### 1.1 Source of truth

Urutan authority:

1. instruksi user untuk task aktif;
2. `CLAUDE.md` dan nearest `AGENTS.md`;
3. live source, tests, package manifests, dan configuration;
4. `PRD.md`, `RULES.md`, `REVIEW-CONTRACT.md`;
5. `MODULAR-MIGRATION-LEDGER.md` dan `MODULAR-MIGRATION-EVIDENCE.md`;
6. `TARGET-FILE-TREE.md` dan `MODULAR-REFACTOR-PROMPT.md`.

Jika target tree dan ledger berbeda untuk current file tertentu, ledger yang sudah
diaudit menjadi migration decision untuk file itu. Target tree tetap menjelaskan
responsibility dan arah arsitektur.

### 1.2 Roles

| Role                | Authority                                                                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| User                | Menyetujui plan, memulai phase, menerima/menolak stop-gate, dan mengizinkan dependency/contract/commit/push |
| Writer              | Mengubah hanya allowlist phase aktif, menjalankan gate, dan menyerahkan evidence; tidak boleh self-approve  |
| Supervisor/reviewer | Read-only pada production source; memverifikasi diff/gate/browser evidence dan mencatat verdict             |

Hanya supervisor yang boleh menaikkan ledger berdasarkan evidence:

```text
mapped → scaffolded → wired → verified → retired
```

- `verified` membutuhkan characterization/parity evidence, seluruh required gate, dan
  browser evidence jika UI/route terpengaruh.
- `retired` membutuhkan status `verified` serta bukti tidak ada consumer tersisa.
- Tidak ada phase yang otomatis mengizinkan phase berikutnya.

### 1.3 Phase lifecycle

```text
PENDING
  → APPROVED
  → IN_PROGRESS
  → READY_FOR_REVIEW
  → PASS | BLOCKED
```

`PASS` hanya diberikan oleh supervisor. User kemudian menentukan apakah phase berikutnya
boleh dimulai.

## 2. Global Guardrails

Aturan berikut berlaku pada seluruh Phase 01–05:

- deny-by-default: file yang tidak tertulis pada allowlist phase/sub-wave adalah
  forbidden;
- satu phase dan satu vertical module aktif pada satu waktu;
- pisahkan perubahan contract, compatibility wiring, move/rename, dan behavior;
- tidak ada big-bang rewrite;
- tidak mengubah existing domain/data contract tanpa approval terpisah;
- tidak menambah third-party dependency;
- tidak menambah backend, database, auth, payment, delivery, deployment, atau hardware;
- tidak membuat remote plugin loading, global mutable service locator, atau registry
  gabungan Admin–Storefront;
- manifest tidak boleh memiliki business rule, React, AntD, screen import, mutable state,
  atau concrete adapter;
- `main.tsx` tetap bootstrap-only dan `App.tsx` tetap composition-only;
- route, locale, Rupiah formatting, single outlet `wm-1`, storage key, dan repository
  semantics tidak berubah;
- jangan menghapus test, menonaktifkan lint, atau memformat file di luar scope;
- jangan menjalankan reset, clean, forced checkout, commit, atau push tanpa instruksi
  eksplisit.

Protected behavior lintas domain:

- paid cancellation menghasilkan Finance refund dan Inventory reversal secara atomik
  serta idempotent;
- unpaid cancellation tidak menghasilkan refund/reversal;
- invalid order transition tetap ditolak;
- POS session tetap persisten dan cash close tetap merekonsiliasi expected/actual/variance;
- inventory consumption/reversal tetap idempotent;
- ID/EN key parity dan separator Rupiah Indonesia tetap stabil.

## 3. Common Execution and Evidence Contract

### 3.1 Start-of-phase preflight

Writer wajib:

1. memperoleh approval phase dari user;
2. mencatat HEAD, branch, dan `git status`;
3. membuktikan tidak ada production-source drift yang belum dipetakan;
4. membaca ledger rows milik module aktif;
5. mengisi phase baseline pada `MODULAR-MIGRATION-EVIDENCE.md`;
6. memastikan previous phase berstatus `PASS`;
7. mengunci allowlist dan forbidden files dalam handoff phase.

Dirty working tree bukan alasan melakukan reset. Jika perubahan lain bersinggungan
dengan allowlist, phase berstatus `BLOCKED`.

### 3.2 Documentation permissions

Role-based documentation scope:

- writer menyerahkan command output dan evidence paths;
- supervisor boleh mengedit:
  - `document contexts/MODULAR-MIGRATION-EVIDENCE.md`;
  - `document contexts/MODULAR-MIGRATION-LEDGER.md`;
  - status phase pada plan yang sudah disetujui;
- `PRD.md`, `RULES.md`, `SCHEMA.md`, dan target architecture tidak boleh diubah untuk
  membuat implementation yang menyimpang terlihat valid.

### 3.3 Gate commands

Jalankan narrow gate terlebih dahulu, lalu required full gate.

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test -- --maxWorkers=2
npm run build
git diff --check
```

Admin source berubah:

```powershell
npx -y @ant-design/cli lint apps/admin/src --format json
```

Storefront source berubah:

```powershell
npx -y @ant-design/cli lint apps/storefront/src --format json
```

Perubahan shared package, composition root, public contract, route contract, atau
provider identity selalu membutuhkan full-monorepo gate. Historical Phase 00 result
tidak boleh dilaporkan sebagai gate baru.

### 3.4 Browser evidence

Browser QA wajib jika phase menyentuh provider startup, route, navigation, screen
wiring, component callback, atau user-visible diagnostics.

Evidence minimum untuk setiap material change:

- logical route/deep link yang terpengaruh;
- loading, success, empty, error, retry, disabled, dan not-found yang relevan;
- keyboard, visible focus, console error, serta horizontal overflow;
- screenshot atau trace path;
- surface, arah fluid-resize sweep, dan tanggal; ukuran viewport exact boleh dicatat
  sebagai metadata evidence, tetapi bukan gate.

Required fluid QA policy:

- **Admin — fluid desktop-first:** mulai dari layout desktop yang tersedia, lalu resize
  kontinu menuju ruang yang lebih sempit dan kembali menuju ruang yang lebih lebar.
  Sidebar, table, form, dialog, focus, dan overflow harus tetap usable sepanjang sweep;
- **Storefront — fluid mobile-first:** mulai dari ruang narrow/mobile yang tersedia, lalu
  resize kontinu melewati intermediate layout sampai desktop lebar. Catalog, detail,
  cart, checkout, dan confirmation harus beradaptasi tanpa bergantung pada device ratio;
- sample screenshot boleh diambil pada titik narrow/intermediate/wide yang ditemukan
  selama sweep, tetapi tidak ada resolusi, aspect ratio, breakpoint, atau parity pair
  berbasis pixel yang menjadi syarat `PASS`.

Phase 05 closure melakukan route smoke pada seluruh Storefront sambil menjalankan fluid
mobile-first sweep dari narrow ke wide, termasuk setiap perubahan layout atau breakpoint
aktual yang terlihat selama resize.

Tidak tersedia browser berarti visual verdict `BLOCKED`/`PARTIAL`, bukan `PASS`.

### 3.5 Remediation and rollback

Rollback berarti mengembalikan runtime ke compatibility path yang masih aktif, bukan
`git reset`, `git clean`, atau forced checkout.

- legacy source tetap dipertahankan sampai target path `verified`;
- registration baru harus dapat dinonaktifkan dari composition root tanpa menghapus
  implementation lama;
- failed registration harus melepaskan capability yang sempat didaftarkan;
- retry tidak boleh menggandakan module, capability, order, refund, atau inventory
  reversal;
- failure dicatat pada evidence dengan remediation dan next safe action.

## 4. Phase Summary and Stop-Gates

| Phase | Focus                                | Pilot/first slice           | Stop-gate                                                      |
| ----- | ------------------------------------ | --------------------------- | -------------------------------------------------------------- |
| 01    | Headless module contracts            | `@warungmeng/module-system` | Contract review + graph/capability/discovery tests + full gate |
| 02    | Admin registry skeleton              | Dashboard                   | Automated gate + Dashboard browser parity + review             |
| 03    | Declarative Admin nav/routes         | Dashboard contributions     | Per-module parity + Admin route/nav browser matrix + review    |
| 04    | Admin headless capability boundaries | Orders cancellation         | Per-sub-wave parity; atomicity/idempotency; review             |
| 05    | Storefront registry/composition      | Catalog                     | Storefront automated gate + browser parity + review            |

## 5. Pilot Selection

### 5.1 Primary pilot: Admin Dashboard

Dashboard dipilih untuk Phase 02 karena:

- read-heavy dan tidak memiliki mutation workflow utama;
- tidak memiliki browser-storage ownership;
- sudah memiliki application models/tests;
- mempunyai empat repository singleton dependencies sehingga dapat membuktikan
  composition-root injection;
- mempunyai dua route (`/` dan `/reports`) sehingga cukup representatif untuk Phase 03;
- kegagalan dapat dikembalikan ke legacy wiring tanpa memengaruhi transaksi.

Tidak dipilih sebagai pilot:

- Menu: CRUD dan editor draft;
- Settings: theme/storage side effects;
- Orders/POS/Inventory/Finance: cross-domain mutation dan idempotency;
- Storefront Catalog: memiliki coupling dua arah dengan Cart.

### 5.2 Storefront pilot: Catalog

Catalog tetap first slice Phase 05 karena mayoritas flow read/configure dan route-nya
menjadi entry Storefront. Catalog bukan pilot global karena coupling dengan Cart harus
ditangani melalui compatibility/public contract, bukan dipindah secara spekulatif ke
shared package.

## 6. Phase 01 — Headless Module Contracts

### 6.1 Execution contract

| Field          | Value                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase ID       | 01                                                                                                                                                |
| Status         | `PASS — supervisor-reviewed 27 Juli 2026`                                                                                                         |
| Objective      | Membuat package headless `@warungmeng/module-system` dengan manifest, graph, registry, capability, discovery, diagnostics, dan lifecycle contract |
| Surface        | Shared, surface-aware (`admin` atau `storefront`)                                                                                                 |
| Module owner   | `packages/module-system`                                                                                                                          |
| Baseline       | Phase 00 closure + phase-start HEAD                                                                                                               |
| Stop condition | Contract review; tidak boleh wire ke app                                                                                                          |
| Evidence path  | Evidence Wave 01/contract-review entry yang ditambahkan ke `MODULAR-MIGRATION-EVIDENCE.md`                                                        |

### 6.2 Allowed files

```text
packages/module-system/package.json
packages/module-system/tsconfig.json
packages/module-system/src/index.ts
packages/module-system/src/contracts/**
packages/module-system/src/registry/**
packages/module-system/src/capabilities/**
packages/module-system/src/discovery/**
packages/module-system/src/diagnostics/**
packages/module-system/src/tests/**
package-lock.json              # hanya jika npm perlu mencatat workspace package
```

Reviewer-only documentation updates mengikuti §3.2.

### 6.3 Forbidden files

```text
apps/**
packages/domain/**
packages/data/**
packages/i18n/**
packages/ui-admin/**
packages/ui-storefront/**
packages/config/**
package.json
tsconfig.base.json
eslint.config.ts
vitest.config.ts
```

Tidak boleh ada third-party dependency. Jika package membutuhkan perubahan root script,
tsconfig, lint, atau test config, Phase 01 berhenti untuk contract/scope review.

### 6.4 Required TypeScript signatures

Signatures berikut adalah contract target. Implementasi boleh membagi tipe ke file pada
target tree, tetapi tidak boleh mengurangi behavior contract tanpa review.

#### Stable identity and contributions

```ts
export const MODULE_SURFACES = ["admin", "storefront"] as const;
export type WarungMengSurface = (typeof MODULE_SURFACES)[number];

export type ModuleId = `${WarungMengSurface}.${string}`;
export type ContributionId = `${string}.${string}`;
export type CapabilityId = `${string}.${string}`;
export type ComponentId = `${WarungMengSurface}.${string}`;

export interface ModuleDependency {
  readonly moduleId: ModuleId;
  readonly optional?: boolean;
}

export interface ModuleCapabilityDeclaration {
  readonly id: CapabilityId;
  readonly version: 1;
}

export interface ModuleCapabilityRequirement {
  readonly id: CapabilityId;
  readonly version: 1;
  readonly optional?: boolean;
}

export interface ModuleContributionBase {
  readonly id: ContributionId;
  readonly order: number;
}

export interface ModuleNavigationContribution extends ModuleContributionBase {
  readonly kind: "navigation";
  readonly labelKey: string;
  readonly routeId: ContributionId;
  readonly iconId?: string;
  readonly parentId?: ContributionId;
}

export interface ModuleRouteContribution extends ModuleContributionBase {
  readonly kind: "route";
  readonly path: string;
  readonly componentId: ComponentId;
  readonly parentRouteId?: ContributionId;
  readonly index?: boolean;
}

export interface ModuleRedirectContribution extends ModuleContributionBase {
  readonly kind: "redirect";
  readonly path: string;
  readonly to: string;
  readonly replace?: boolean;
}

export interface ModuleActionContribution extends ModuleContributionBase {
  readonly kind: "action";
  readonly labelKey: string;
  readonly placement: string;
  readonly requiredCapability?: CapabilityId;
}

export interface ModuleTabContribution extends ModuleContributionBase {
  readonly kind: "tab";
  readonly labelKey: string;
  readonly parentId: ContributionId;
  readonly routeId: ContributionId;
}

export type ModuleContribution =
  | ModuleNavigationContribution
  | ModuleRouteContribution
  | ModuleRedirectContribution
  | ModuleActionContribution
  | ModuleTabContribution;
```

`componentId` dan `iconId` diselesaikan oleh app-local UI registries. Manifest tidak
boleh mengimpor React component, React Router, atau AntD icon.

#### Manifest and diagnostics

```ts
export interface WarungMengModuleManifest {
  readonly id: ModuleId;
  readonly version: 1;
  readonly surface: WarungMengSurface;
  readonly displayNameKey: string;
  readonly dependsOn?: readonly ModuleDependency[];
  readonly provides?: readonly ModuleCapabilityDeclaration[];
  readonly requires?: readonly ModuleCapabilityRequirement[];
  readonly contributions?: readonly ModuleContribution[];
}

export type ModuleDiagnosticSeverity = "info" | "warning" | "error";

export type ModuleDiagnosticCode =
  | "candidate-load-failed"
  | "manifest-malformed"
  | "duplicate-module-id"
  | "duplicate-contribution-id"
  | "wrong-surface"
  | "unsupported-version"
  | "missing-dependency"
  | "dependency-cycle"
  | "missing-capability"
  | "duplicate-capability"
  | "registration-failed"
  | "disposal-failed";

export interface ModuleDiagnostic {
  readonly code: ModuleDiagnosticCode;
  readonly severity: ModuleDiagnosticSeverity;
  readonly message: string;
  readonly surface: WarungMengSurface;
  readonly moduleId?: ModuleId;
  readonly source?: string;
  readonly details?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface ModuleDiagnosticSink {
  report(diagnostic: ModuleDiagnostic): void;
}
```

Diagnostics tidak boleh memuat secret, raw stack, atau user data.

#### Typed capability contract

```ts
declare const capabilityContractType: unique symbol;

export interface CapabilityToken<TContract> {
  readonly id: CapabilityId;
  readonly version: 1;
  readonly [capabilityContractType]?: (contract: TContract) => TContract;
}

export function createCapabilityToken<TContract>(id: CapabilityId): CapabilityToken<TContract>;

export type CapabilityResolution<TContract> =
  | {
      readonly status: "available";
      readonly ownerModuleId: ModuleId;
      readonly value: TContract;
    }
  | {
      readonly status: "missing";
      readonly capabilityId: CapabilityId;
    };

export interface CapabilityRegistration {
  readonly capabilityId: CapabilityId;
  dispose(): void | Promise<void>;
}

export type CapabilityRegistrationResult =
  | {
      readonly status: "registered";
      readonly registration: CapabilityRegistration;
    }
  | {
      readonly status: "duplicate";
      readonly capabilityId: CapabilityId;
      readonly existingOwnerModuleId: ModuleId;
    };

export interface ScopedCapabilityRegistry {
  resolve<TContract>(token: CapabilityToken<TContract>): CapabilityResolution<TContract>;

  provide<TContract>(
    token: CapabilityToken<TContract>,
    implementation: TContract,
  ): CapabilityRegistrationResult;
}
```

Registry yang diberikan ke extension terikat pada `moduleId`; extension tidak dapat
memalsukan owner capability.

#### Extension lifecycle and module registry

```ts
export interface ModuleActivation {
  dispose(): void | Promise<void>;
}

export interface WarungMengExtensionContext {
  readonly moduleId: ModuleId;
  readonly surface: WarungMengSurface;
  readonly capabilities: ScopedCapabilityRegistry;
  readonly diagnostics: ModuleDiagnosticSink;
}

export interface WarungMengExtension {
  readonly manifest: WarungMengModuleManifest;
  register(
    context: WarungMengExtensionContext,
  ): void | ModuleActivation | Promise<void | ModuleActivation>;
}

export type ModuleRegistrationResult =
  | {
      readonly status: "registered";
      readonly manifest: WarungMengModuleManifest;
    }
  | {
      readonly status: "rejected";
      readonly diagnostics: readonly ModuleDiagnostic[];
    }
  | {
      readonly status: "failed";
      readonly diagnostics: readonly ModuleDiagnostic[];
    };

export interface ModuleRegistry {
  readonly surface: WarungMengSurface;

  register(extension: WarungMengExtension): Promise<ModuleRegistrationResult>;

  registerAll(
    extensions: readonly WarungMengExtension[],
  ): Promise<readonly ModuleRegistrationResult[]>;

  resolve(moduleId: ModuleId): WarungMengModuleManifest | undefined;

  list(): readonly WarungMengModuleManifest[];

  dispose(moduleId: ModuleId): Promise<void>;

  disposeAll(): Promise<void>;
}
```

Registration bersifat deterministic dan atomic per module. Jika `register` gagal,
registry melepaskan capability/activation yang dibuat selama attempt tersebut.

#### Discovery and graph results

```ts
export interface ModuleCandidate {
  readonly source: string;
  load(): unknown | Promise<unknown>;
}

export interface ValidatedModuleCandidate {
  readonly source: string;
  readonly extension: WarungMengExtension;
}

export interface RejectedModuleCandidate {
  readonly source: string;
  readonly diagnostics: readonly ModuleDiagnostic[];
}

export interface ModuleDiscoveryResult {
  readonly valid: readonly ValidatedModuleCandidate[];
  readonly rejected: readonly RejectedModuleCandidate[];
  readonly diagnostics: readonly ModuleDiagnostic[];
}

export type ModuleGraphValidationResult =
  | {
      readonly status: "valid";
      readonly orderedModuleIds: readonly ModuleId[];
    }
  | {
      readonly status: "invalid";
      readonly diagnostics: readonly ModuleDiagnostic[];
    };

export function discoverModuleCandidates(
  surface: WarungMengSurface,
  candidates: readonly ModuleCandidate[],
): Promise<ModuleDiscoveryResult>;

export function validateModuleGraph(
  surface: WarungMengSurface,
  manifests: readonly WarungMengModuleManifest[],
): ModuleGraphValidationResult;

export function resolveModuleOrder(
  manifests: readonly WarungMengModuleManifest[],
): ModuleGraphValidationResult;
```

`ModuleCandidate.load` menerima explicit import atau hasil `import.meta.glob` dari app.
Package tidak melakukan filesystem scan, network loading, package installation, atau
remote-code execution.

### 6.5 Tests to add

Minimum Phase 01 test matrix:

- manifest valid dan malformed;
- unsupported version dan wrong surface;
- duplicate module/contribution/capability IDs;
- missing required dependency dan optional dependency;
- dependency cycle serta deterministic order;
- missing required/optional capability;
- capability type resolution, duplicate provider, dan disposal;
- registration failure rollback;
- one invalid optional module tidak menjatuhkan valid modules;
- discovery candidate load failure;
- registry disposal order;
- boundary test: tidak ada React, React Router, AntD, CSS, browser storage, app import,
  Warung Meng domain, atau concrete repository.

### 6.6 Validation

Narrow:

```powershell
npm run typecheck --workspace @warungmeng/module-system
npm run test -- packages/module-system/src --maxWorkers=2
```

Kemudian full gate §3.3. Browser QA tidak diperlukan karena package headless tidak
dirender.

### 6.7 Success, fallback, and handoff

Success:

- seluruh contract dapat diimpor dari package public `index.ts`;
- graph/capability/discovery tests hijau;
- package tidak memiliki forbidden import/dependency;
- full gate hijau;
- supervisor menerima contract.

Fallback:

- package tetap tidak direferensikan app;
- jika contract ditolak, status tetap `scaffolded` atau `BLOCKED`;
- perbaiki contract di Phase 01, bukan lewat workaround app.

Stop: serahkan API surface, test evidence, diagnostics behavior, dan unresolved contract
decisions. Jangan mulai Phase 02.

## 7. Phase 02 — Admin Registry Skeleton and Dashboard Pilot

### 7.1 Execution contract

| Field            | Value                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| Phase ID         | 02                                                                                                              |
| Status           | `PASS — supervisor-reviewed 28 Juli 2026`                                                                       |
| Objective        | Membuat Admin composition/runtime/discovery skeleton dan mendaftarkan Dashboard melalui compatibility extension |
| Surface          | Admin                                                                                                           |
| Module owner     | Admin app + Dashboard                                                                                           |
| Preconditions    | Phase 01 PASS dan contract frozen                                                                               |
| Current behavior | `App.tsx` memakai providers/router existing; Dashboard membaca empat app-local repository singletons            |
| Target contract  | Separate Admin registry; composition-owned repositories; existing Dashboard UI/routes tetap aktif               |
| Stop condition   | Automated gate + Dashboard browser parity + supervisor review                                                   |
| Evidence path    | Wave 02 Dashboard block + Cutover Log                                                                           |

### 7.2 Allowed files

```text
apps/admin/package.json
package-lock.json
apps/admin/src/App.tsx
apps/admin/src/App.test.tsx
apps/admin/src/app/composition/createAdminRuntime.ts
apps/admin/src/app/composition/createAdminRepositories.ts
apps/admin/src/app/composition/adminRuntime.ts
apps/admin/src/app/composition/AdminRuntimeProvider.tsx
apps/admin/src/app/discovery/adminModuleCandidates.ts
apps/admin/src/app/discovery/discoverAdminModules.ts
apps/admin/src/app/discovery/adminModuleDiagnostics.ts
apps/admin/src/app/providers/AdminApplicationProviders.tsx
apps/admin/src/components/layout/AdminModuleDiagnosticAlert.tsx
apps/admin/src/features/dashboard/manifest/**
apps/admin/src/features/dashboard/application/ports/dashboardRepositoriesPort.ts
apps/admin/src/features/dashboard/application/dashboardRepositories.ts
apps/admin/src/features/dashboard/application/useDashboardReportData.ts
apps/admin/src/features/dashboard/application/useDashboardReportData.test.tsx
apps/admin/src/features/dashboard/index.ts
apps/admin/src/tests/adminModuleDiscovery.test.ts
apps/admin/src/tests/adminImportBoundary.test.ts
```

`AdminModuleDiagnosticAlert.tsx` hanya boleh dibuat jika diagnostic benar-benar
ditampilkan. Perubahan itu memerlukan browser evidence.

### 7.3 Forbidden files

```text
apps/admin/src/app/AppRoutes.tsx
apps/admin/src/app/navigation.tsx
apps/admin/src/components/layout/AdminSidebar.tsx
apps/admin/src/features/dashboard/components/**
apps/admin/src/features/dashboard/views/**
apps/admin/src/features/dashboard/screens/**
apps/admin/src/features/{menu,orders,pos,inventory,finance,settings}/**
apps/storefront/**
packages/module-system/**        # frozen; blocker kembali ke Phase 01
packages/domain/**
packages/data/**
packages/i18n/**
packages/ui-admin/**
packages/ui-storefront/**
```

### 7.4 Migration and compatibility path

```text
createAdminRepositories
  → createAdminRuntime
  → discover Dashboard extension
  → register reporting.read
  → Dashboard repository port delegates to current repository implementations
  → existing Dashboard hooks/screens/routes
```

- `AppRoutes.tsx` dan `navigation.tsx` tetap source of truth.
- Dashboard compatibility extension tidak menduplikasi report logic.
- Current repository exports boleh menjadi delegating wrappers selama consumer belum
  berpindah.
- Optional module failure menghasilkan safe diagnostic; required Dashboard failure
  memblokir Dashboard dengan error eksplisit tanpa merusak shell.

### 7.5 Tests and validation

Tests:

- Admin runtime hanya menerima surface `admin`;
- candidate registration deterministic;
- invalid optional candidate menghasilkan diagnostic;
- repository object identity konsisten pada provider lifecycle;
- Dashboard model output identik sebelum/sesudah injection;
- provider rerender tidak membuat repository/runtime baru;
- App tetap composition-only.

Validation:

- target Dashboard/runtime tests;
- full gate §3.3;
- Admin AntD lint;
- browser logical routes `/` dan `/reports`, period/search behavior, ID/EN, reload,
  console, focus, dan overflow sepanjang fluid desktop-first resize sweep.

### 7.6 Success, fallback, and handoff

Success:

- Dashboard terdaftar satu kali melalui Admin runtime;
- Dashboard output/route/nav tidak berubah;
- no cross-app or forbidden package imports;
- related ledger rows minimal `wired`; `verified` hanya setelah evidence lengkap.

Fallback:

- App kembali memakai provider/repository wiring existing;
- compatibility extension tetap terisolasi dan tidak menjadi source of truth kedua;
- tidak menghapus legacy repository exports.

Stop: supervisor review dan user approval. Jangan mengubah route/navigation metadata atau
memulai module Admin lain.

## 8. Phase 03 — Declarative Admin Navigation and Routes

### 8.1 Execution contract

| Field            | Value                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| Phase ID         | 03                                                                                              |
| Status           | `PASS — supervisor-reviewed 28 Juli 2026`                                                       |
| Objective        | Memindahkan static Admin navigation/route metadata ke feature manifests dan app-local resolvers |
| Surface          | Admin                                                                                           |
| Module owner     | Admin routing/navigation + satu active feature per checkpoint                                   |
| Preconditions    | Phase 02 PASS; navigation ID/EN characterization gap ditutup dan fail-on-removal dibuktikan     |
| Current behavior | `AppRoutes.tsx` dan `navigation.tsx` adalah centralized source                                  |
| Target contract  | Headless contributions + app-local React/icon/component registries                              |
| Stop condition   | Seluruh module checkpoint reviewed; browser route/nav parity; no legacy consumers               |
| Evidence path    | Wave 03 row per module + Cutover Log                                                            |

### 8.2 Module order

Satu changeset dan review per module:

1. Dashboard;
2. Menu;
3. Settings parent, Theme, Business Hours;
4. Inventory;
5. Finance;
6. POS;
7. Orders.

Urutan ini memigrasikan low-risk metadata lebih dahulu. Urutan sidebar final, HPP di
bawah Inventory, dan current route paths tidak berubah.

### 8.3 Allowed files

```text
apps/admin/src/app/AppRoutes.tsx
apps/admin/src/app/navigation.tsx
apps/admin/src/app/navigation.test.tsx
apps/admin/src/app/routing/**
apps/admin/src/app/navigation/**
apps/admin/src/components/layout/AdminSidebar.tsx
apps/admin/src/components/layout/AdminShell.tsx
apps/admin/src/components/layout/AdminShell.test.tsx
apps/admin/src/features/<active-module>/manifest/**
apps/admin/src/features/<active-module>/index.ts
apps/admin/src/tests/adminRouteContributions.test.tsx
apps/admin/src/tests/adminNavigationContributions.test.ts
apps/admin/src/tests/adminImportBoundary.test.ts
```

Untuk Settings, `<active-module>` boleh menunjuk parent `settings`, `settings/theme`, atau
`settings/business-hours`, satu per checkpoint.

#### Phase 03 scope amendment — supervisor closure, 28 Juli 2026

The manifest cutover also requires the app-local discovery/fallback seam and one
render-based integration proof. The following files are therefore explicitly
allowed for this phase:

```text
apps/admin/src/app/discovery/adminModuleCandidates.ts
apps/admin/src/app/discovery/adminBuiltInManifests.ts
apps/admin/src/App.test.tsx
apps/admin/src/tests/adminLiveIntegration.test.tsx
```

These files contain candidate/manifest composition and integration assertions only;
feature application logic, screens, views, components, CSS, shared packages, and
Storefront remain outside the amendment.

### 8.4 Forbidden files

```text
apps/admin/src/features/**/application/**
apps/admin/src/features/**/components/**
apps/admin/src/features/**/views/**
apps/admin/src/features/**/screens/**
apps/admin/src/components/layout/*.css
apps/storefront/**
packages/**
```

Exception forbidden hanya melalui phase amendment dan user approval.

### 8.5 Migration and compatibility path

- Manifest menyimpan IDs, translation keys, order, route metadata, icon ID, dan
  component ID.
- React lazy imports berada di `adminRouteComponentRegistry.ts`, bukan manifest.
- Concrete AntD icons berada di `adminIconRegistry.tsx`.
- Resolver menghasilkan navigation/route view model deterministic.
- App-shell catch-all `* → /` remains a platform fallback; feature-owned redirects
  (for example `/calculator → /inventory`) belong to manifests.
- Legacy lists tetap aktif untuk module yang belum dipindahkan.
- Duplicate ID/path, missing parent, wrong surface, atau unknown component/icon ID
  menghasilkan diagnostic.
- Legacy `AppRoutes.tsx`/`navigation.tsx` hanya dihapus setelah seluruh contribution
  `verified` dan consumer graph kosong.

### 8.6 Tests and browser scenarios

Sebelum first cutover:

- tambahkan transitive navigation ID/EN test;
- buktikan test gagal ketika satu nested/module label key dihapus;
- pertahankan existing route/deep-link tests.

Per module:

- stable IDs dan deterministic order;
- duplicate route/nav/action/tab rejected;
- parent/child route and navigation relation;
- active state;
- ID/EN labels;
- unknown component/icon diagnostic;
- current redirects termasuk `/calculator` dan catch-all `* → /`;
- HashRouter deep links.

Validation:

- active-module tests;
- full gate §3.3;
- Admin AntD lint;
- browser desktop/narrow: all affected routes, sidebar collapsed/expanded, ID/EN,
  refresh/deep link, not-found/redirect, keyboard/focus, console, overflow.

### 8.7 Success, fallback, and handoff

Success:

- every Admin route/nav contribution memiliki satu owner;
- UI order, label, icon, nested route, redirects, dan deep links parity;
- no duplicate source of truth setelah final module cutover;
- ledger/evidence diperbarui per module.

Fallback:

- resolver menggunakan legacy entry untuk module checkpoint yang gagal;
- jangan menghapus legacy list;
- status gagal maksimal `wired`, bukan `verified`.

Stop: supervisor review atas module terakhir dan full Phase 03 evidence. Jangan masuk
headless business orchestration.

## 9. Phase 04 — Admin Headless Capability Boundaries

### 9.1 Replan authority, baseline, and execution contract

Phase 04 direvisi pada 29 Juli 2026 atas instruksi user. Model lama yang menjalankan
`04A`–`04E` sebagai prompt, QA, review, dan commit terpisah **superseded** karena memecah
satu dependency graph lintas fitur menjadi solusi lokal yang berulang dan rawan drift.

Replan ini adalah exception eksplisit untuk guardrail “satu vertical module aktif” pada
§2. Exception hanya berlaku untuk cluster operasional Admin berikut:

```text
Catalog read support → Inventory → Orders → POS
                         ↑          ↓
                         └─ Finance ┘
```

Scope tetap bounded ke composition, discovery/capability registration, application
contracts, data transaction adapter yang disebut eksplisit, dan dependency injection
pada routed screens. Ini bukan izin big-bang rewrite untuk seluruh Admin.

| Field            | Value                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase ID         | 04                                                                                                                                                  |
| Status           | `PASS — final automated gate, Admin AntD lint, browser critical-flow matrix, and supervisor review completed 29 Juli 2026`                          |
| Baseline commit  | `2ab788a` — fresh composition-owned repository instances dan compatibility binding                                                                  |
| In-flight source | Resolved — partial 04B was replaced by the canonical one-wave implementation and is included in the final Phase 04 PASS                             |
| Objective        | Menutup seluruh cross-feature Admin operational graph dengan composition-owned capabilities dan tanpa internal cross-feature singleton imports      |
| Surface          | Admin                                                                                                                                               |
| Module cluster   | Catalog read support, Orders, POS, Inventory, Finance                                                                                               |
| Preconditions    | Phase 03 PASS; 04A commit tersedia; protected behavior tests tetap menjadi baseline                                                                 |
| Target contract  | Satu data/runtime assembly, satu capability graph, manifest-provided contracts, app-owned injection adapters, dan explicit transaction/storage seam |
| Executor model   | Claude mengimplementasikan satu Phase 04 utuh; tidak menjalankan QA, tidak commit, tidak push                                                       |
| Supervisor model | Codex mereview seluruh diff dan menjalankan automated/browser QA tepat satu kali setelah implementation handoff                                     |
| Stop condition   | Satu final Phase 04 verdict setelah seluruh work package selesai; tidak ada stop-gate per module                                                    |
| Evidence path    | Satu Wave 04 closure block + capability matrix + atomicity/storage/browser evidence                                                                 |

Phase 04 memakai **satu prompt, satu implementation wave, satu final QA, dan satu
checkpoint commit**. Work package pada §9.2 adalah urutan kerja internal, bukan alasan
untuk handoff, QA, commit, atau supervisor verdict sementara.

Hard stop hanya berlaku jika executor membuktikan bahwa:

- perubahan di luar allowlist §9.7 diperlukan;
- invariant domain pada §2 harus diubah;
- module-system contract harus diubah;
- atomic rollback tidak dapat dibuat oleh exact additive data transaction amendment
  pada §9.5.

Masalah implementasi yang masih dapat diselesaikan di dalam allowlist tidak boleh
memecah Phase 04 menjadi prompt baru.

### 9.2 Internal work packages — no intermediate stop-gates

| Order | Work package                      | Required outcome                                                                                                                                       |
| ----- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 04.0  | Freeze capability/consumer matrix | Kunci provider, consumer, exact port methods, lifecycle, failure semantics, dan compatibility consumers sebelum source rewrite                         |
| 04.1  | Rebase composition/data ownership | Pertahankan per-runtime identity dari 04A; buat atomic Order+Inventory transaction seam dan explicit POS storage adapter; hapus redundant 04A wiring   |
| 04.2  | Assemble capability graph         | Buat seluruh implementation sekali di composition root; inject ke extension constructors; register declared tokens dengan reversible lifecycle         |
| 04.3  | Cut over application consumers    | Orders, POS, Inventory, Finance memakai module-owned commands/ports; seluruh direct internal cross-feature repository imports pada cluster menjadi nol |
| 04.4  | Retire superseded compatibility   | Hapus proxy/singleton/moved source hanya jika consumer scan nol; jangan mempertahankan dua implementation aktif untuk workflow yang sama               |
| 04.5  | One final handoff                 | Exact diff, contract matrix, unresolved debt, dan statement “validation not run”; serahkan ke Codex untuk satu final QA                                |

Executor boleh mengubah urutan file di dalam work package untuk menjaga buildable state.
Executor tidak boleh menyerahkan hasil setelah 04.1, 04.2, 04.3, atau satu module saja.

### 9.3 Treatment of committed 04A and partial 04B

Commit `2ab788a` adalah evidence bahwa composition dapat:

- membuat Order, Inventory, Finance, dan Menu Catalog repository baru per runtime;
- memberi Dashboard instance yang strict-identical;
- menjaga separate roots terisolasi;
- melakukan initialize/dispose secara reversible dan idempotent.

Outcome tersebut wajib dipertahankan. Implementasi internalnya **tidak frozen**:

- `createAdminRepositories.ts`, lifecycle binding, dan tests boleh diubah;
- repository compatibility proxies/binding stacks dari 04A boleh disederhanakan atau
  dihapus setelah consumer cluster bermigrasi;
- global mutable binding stack bukan target akhir untuk Orders/POS/Inventory/Finance;
- Menu compatibility path boleh tetap hidup hanya untuk Menu consumers yang memang di
  luar behavioral cutover Phase 04;
- Dashboard degraded startup tetap hanya menonaktifkan Dashboard reporting dan tidak
  boleh mematikan module lain.

Partial 04B pada working tree ketika replan:

- bukan baseline behavior baru;
- test yang menganggap cancelled/refunded order + failed Inventory reversal sebagai
  keberhasilan parsial wajib diganti karena mengunci half-applied workflow;
- file move/port yang masih tepat boleh dipakai ulang;
- staged deletion atau untracked replacement diselesaikan melalui edit/add normal,
  bukan reset, clean, atau forced checkout.

Perubahan terhadap file yang sudah masuk commit 04A bukan regression bila outcome di
atas tetap lulus dan hasil akhir lebih sesuai capability graph canonical.

### 9.4 Frozen capability graph

Semua implementation dibuat lebih dahulu oleh composition root dari instance repository,
transaction adapter, clock/ID runtime, dan storage adapter yang sama. Extension menerima
implementation yang sudah assembled; feature hook/screen dilarang merakit cross-feature
ports.

| Provider surface | Capability IDs                                                                 | Composition dependencies                                                         | Primary consumers                                   |
| ---------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------- |
| Catalog support  | `catalog.read`                                                                 | Menu Catalog repository                                                          | POS catalog; Inventory HPP                          |
| Orders           | `orders.read`, `orders.manage`                                                 | Order repository; `inventory.reverse`; `finance.refund`; atomic data transaction | Orders routes; POS checkout                         |
| Inventory        | `inventory.read`, `inventory.adjust`, `inventory.consume`, `inventory.reverse` | Inventory repository; `catalog.read` for HPP                                     | Inventory routes; Orders cancellation; POS checkout |
| Finance          | `finance.read`, `finance.record`, `finance.refund`                             | Finance repository; Order read port; existing domain ledger/refund projection    | Finance routes; Orders cancellation                 |
| POS              | `pos.session`, `pos.cart`, `pos.checkout`                                      | Catalog read; order create/read; inventory consume; POS session storage          | POS cashier route                                   |

Rules:

- manifest hanya mendeklarasikan `provides`/`requires`, IDs, version, route, dan nav
  metadata; manifest tidak mengimpor screen, repository, storage, React, atau AntD;
- extension menyediakan capability token yang dideklarasikan dan mengembalikan
  reversible activation jika memiliki local compatibility binding;
- `adminModuleCandidates.ts` menerima satu composed capability bundle dan memasukkannya
  ke extension constructors;
- module-system registry menjadi authoritative publication surface untuk extensions;
- `AdminRuntime.capabilities` menyimpan typed UI-injection bundle dengan exact object
  identity yang sama dengan value yang didaftarkan extensions;
- routed screen menerima capability dari runtime bundle melalui app-owned route injection
  adapter atau props; feature tidak mengimpor `app/composition` atau `app/routing`;
- tidak ada feature A yang mengimpor `features/B/application/*Repository`;
- built-in dependency assembly dilakukan topologically di composition root. Jangan
  membuat circular runtime `resolve()` hanya untuk built-in modules yang sudah diketahui.

Complexity budget:

- satu capability implementation per feature cluster; jangan membuat adapter class baru
  untuk setiap repository method;
- port hanya dibuat pada boundary yang benar-benar melintasi owner atau membutuhkan test
  double; same-feature delegation tidak perlu wrapper berlapis;
- gunakan structural typing atau focused `Pick<>` ketika current repository sudah
  memenuhi port tanpa adapter behavior;
- satu workflow hanya memiliki satu active command; legacy dan target command tidak
  boleh berjalan paralel setelah cutover;
- jangan membuat generic `service`, `manager`, locator, event bus, atau abstraction
  framework baru untuk kebutuhan Phase 04;
- file baru harus memiliki consumer aktual pada final consumer scan.

`finance.refund` pada data model saat ini adalah deterministic projection dari settled
Order, bukan persisted manual Finance mutation. Phase 04 wajib membuat fakta ini eksplisit:

- jangan menambah refund write palsu ke `FinanceRepository`;
- capability mengembalikan canonical refund projection/identity yang dipakai ledger;
- exactly-once dibuktikan dari satu settled Order state dan stable reference, bukan dari
  counter atau array buatan yang terpisah dari ledger;
- manual Finance transactions tetap memakai current repository semantics.

### 9.5 Target contracts and exact data amendment

Feature ports berada di feature `application/ports`; commands/orchestration berada di
`application/commands`; concrete implementations dan cross-feature assembly berada di
`app/composition`.

Minimum contract shapes:

```ts
export interface AtomicDataTransaction {
  run<TResult>(operation: () => Promise<TResult>): Promise<TResult>;
}

export interface CatalogReadCapability {
  listMenus(): Promise<readonly MenuItem[]>;
  listCategories(): Promise<readonly MenuCategory[]>;
  listVariantGroups(): Promise<readonly MenuVariantGroup[]>;
}

export interface InventoryReverseCapability {
  revertOrderConsumption(order: Order): Promise<readonly InventoryMovement[]>;
}

export interface FinanceRefundCapability {
  projectRefund(order: Order): readonly FinanceTransaction[];
}

export interface OrdersManageCapability {
  updateStatus(orderId: string, status: OrderStatus): Promise<OrderStatusUpdateResult>;
  cancel(orderId: string): Promise<CancelOrderOutcome>;
}

export type CancelOrderOutcome =
  | { readonly status: "cancelled"; readonly order: Order; readonly refunded: boolean }
  | { readonly status: "not-found" }
  | { readonly status: "invalid-transition"; readonly order: Order }
  | {
      readonly status: "failed";
      readonly reason: "inventory-reversal" | "transaction";
      readonly retryable: true;
      readonly dataChanged: false;
    };

export interface PosSessionStoragePort {
  load(): PosCashierState | null;
  save(state: PosCashierState): void;
  clear(): void;
}
```

Names boleh disesuaikan bila responsibility tetap sama dan tidak menjadi generic
`manager/service/helpers`. Public capability token IDs pada §9.4 tidak boleh diubah.

Strict paid-cancellation atomicity tidak dapat dipenuhi oleh dua repository mutation
tanpa transaction boundary. Phase 04 karena itu memiliki **satu additive data-contract
amendment**:

- tambah `AtomicDataTransaction`;
- tambah in-memory transaction/runtime adapter yang memiliki Order dan Inventory
  resources yang sama dengan composition root;
- `run()` men-snapshot targeted resources, men-serialize overlapping operation,
  me-rollback seluruh targeted mutation ketika callback gagal, lalu rethrow/map failure;
- existing `OrderRepository`, `InventoryRepository`, `FinanceRepository`, dan Menu
  Catalog public behavior tetap backward-compatible;
- tidak ada perubahan domain transition, finance ledger rule, fixture meaning, atau
  persisted backend contract;
- adapter ini boleh mengganti repository construction mechanism yang dibuat pada 04A
  selama per-runtime identity dan isolation tetap terbukti.

POS checkout tidak otomatis diubah menjadi rollback transaction karena current protected
behavior memiliki persisted order + explicit pending Inventory sync/retry. Phase 04
mempertahankan semantics itu, tetapi memindahkannya ke `pos.checkout` dengan idempotent
pending-sync identity.

POS storage decision:

- browser adapter berada di Admin/POS application boundary, bukan domain/data package;
- storage surface: `sessionStorage`;
- key baru yang dikunci oleh Phase 04: `warungmeng.admin.pos-session.v1`;
- serialized state mencakup active session, outlet/opening balance, cart/checkout,
  receipt, pending Inventory sync IDs, cash sales, sequence, dan last close record;
- transient `processing` selalu dipulihkan sebagai `false`;
- invalid/version-mismatch payload kembali ke clean closed session tanpa throw;
- save/clear bersifat explicit dan dapat diganti memory adapter pada tests.

### 9.6 Composition and consumer cutover

Target composition:

```text
createAdminOperationalDataRuntime()
  ├─ repositories
  └─ atomicTransaction

createAdminStorageAdapters()
  └─ posSessionStorage

createAdminCapabilities({ repositories, atomicTransaction, storage, runtime })
  ├─ catalog
  ├─ inventory
  ├─ finance
  ├─ orders
  └─ pos

createAdminModuleCandidates(capabilities)
  └─ feature extensions provide declared tokens

Admin route capability adapters
  └─ read AdminRuntime.capabilities → inject feature-owned props → render lazy screen
```

Cutover rules:

- app-level route adapter boleh mengimpor feature public types dan lazy screens, lalu
  membaca typed bundle dari `AdminRuntime`; feature screen tidak boleh mengimpor
  app-level adapter;
- route path, component ID, navigation order, labels, icons, redirects, dan lazy loading
  tetap identik dengan Phase 03;
- screen edits hanya boleh mengganti dependency/default/callback wiring;
- visible JSX, copy, layout, CSS, and AntD component selection tidak berubah;
- no-capability state harus explicit dan tidak boleh silently memakai instance lain;
- compatibility wrapper hanya boleh hidup bila ada consumer aktual yang belum dapat
  dipindah tanpa keluar Phase 04;
- closure scan wajib membuktikan tidak ada direct cross-feature internal import pada
  cluster Phase 04.

### 9.7 Phase-wide allowlist

Replan ini menggantikan placeholder `<active-module>` lama dengan allowlist seluruh
cluster. File di luar daftar tetap deny-by-default.

Admin composition/discovery/runtime:

```text
apps/admin/src/app/composition/createAdminRepositories.ts
apps/admin/src/app/composition/createAdminRepositories.test.ts
apps/admin/src/app/composition/createAdminCapabilities.ts             # new
apps/admin/src/app/composition/createAdminCapabilities.test.ts        # new
apps/admin/src/app/composition/createAdminStorageAdapters.ts          # new
apps/admin/src/app/composition/createAdminStorageAdapters.test.ts     # new
apps/admin/src/app/composition/createAdminRuntime.ts
apps/admin/src/app/composition/adminRuntime.ts
apps/admin/src/app/composition/AdminRuntimeProvider.tsx
apps/admin/src/app/discovery/adminModuleCandidates.ts
apps/admin/src/app/routing/adminRouteComponentRegistry.ts
apps/admin/src/app/routing/adminCapabilityRouteAdapters.tsx           # new
apps/admin/src/app/routing/adminCapabilityRouteAdapters.test.tsx      # new
apps/admin/src/tests/adminModuleDiscovery.test.ts
apps/admin/src/tests/adminImportBoundary.test.ts
apps/admin/src/tests/adminCapabilityIntegration.test.ts               # new
```

Feature contracts, commands, adapters, manifests, and public entrypoints:

```text
apps/admin/src/features/menu/application/**                           # catalog.read support only
apps/admin/src/features/menu/manifest/**
apps/admin/src/features/menu/index.ts

apps/admin/src/features/orders/application/**
apps/admin/src/features/orders/manifest/**
apps/admin/src/features/orders/index.ts

apps/admin/src/features/pos/application/**
apps/admin/src/features/pos/manifest/**
apps/admin/src/features/pos/index.ts

apps/admin/src/features/inventory/application/**
apps/admin/src/features/inventory/manifest/**
apps/admin/src/features/inventory/index.ts

apps/admin/src/features/finance/application/**
apps/admin/src/features/finance/manifest/**
apps/admin/src/features/finance/index.ts
```

Exact routed screen compatibility owners and tests:

```text
apps/admin/src/features/orders/screens/OrderListScreen.tsx
apps/admin/src/features/orders/screens/OrderListScreen.test.tsx
apps/admin/src/features/orders/screens/OrderDetailScreen.tsx
apps/admin/src/features/orders/screens/OrderDetailScreen.test.tsx

apps/admin/src/features/pos/screens/PosCashierScreen.tsx
apps/admin/src/features/pos/screens/PosCashierScreen.test.tsx

apps/admin/src/features/inventory/screens/InventoryMaterialsScreen.tsx
apps/admin/src/features/inventory/screens/InventoryMovementsScreen.tsx
apps/admin/src/features/inventory/screens/InventoryHppScreen.tsx
apps/admin/src/features/inventory/screens/InventoryScreens.test.tsx

apps/admin/src/features/finance/screens/FinanceScreen.tsx
apps/admin/src/features/finance/screens/FinanceOverviewScreen.tsx
apps/admin/src/features/finance/screens/FinanceTransactionListScreen.tsx
apps/admin/src/features/finance/screens/FinanceTransactionListScreen.test.tsx
apps/admin/src/features/finance/screens/FinanceExpenseScreen.tsx
apps/admin/src/features/finance/tests/**
```

Exact additive data transaction amendment:

```text
packages/data/src/repositories/AtomicDataTransaction.ts               # new
packages/data/src/runtime/**                                          # new, operational data runtime only
packages/data/src/mocks/InMemoryAtomicDataTransaction.ts              # new
packages/data/src/mocks/InMemoryAtomicDataTransaction.test.ts         # new
packages/data/src/mocks/InMemoryOrderRepository.ts
packages/data/src/mocks/InMemoryOrderRepository.test.ts
packages/data/src/mocks/InMemoryInventoryRepository.ts
packages/data/src/mocks/InMemoryInventoryRepository.test.ts
packages/data/src/index.ts
```

`packages/data` changes harus additive/backward-compatible dan hanya untuk transaction
ownership/rollback. Jika implementation membutuhkan file package lain, executor mencatat
exact reason sebagai hard blocker; jangan memperlebar scope sendiri.

### 9.8 Forbidden files

```text
apps/admin/src/App.tsx
apps/admin/src/main.tsx
apps/admin/src/app/AppRoutes.tsx
apps/admin/src/app/navigation.tsx
apps/admin/src/app/navigation/**
apps/admin/src/app/routing/resolveAdminRoutes.ts
apps/admin/src/app/providers/**
apps/admin/src/components/**
apps/admin/src/features/**/components/**
apps/admin/src/features/**/views/**
apps/admin/src/features/dashboard/**
apps/admin/src/features/settings/**
apps/admin/src/**/*.css
apps/storefront/**
packages/domain/**
packages/i18n/**
packages/ui-admin/**
packages/ui-storefront/**
packages/module-system/**
packages/config/**
package.json
package-lock.json
tsconfig.base.json
eslint.config.ts
vite.config.ts
vitest.config.ts
```

No dependency addition, route/nav redesign, visible UI redesign, backend contract, auth,
payment integration, or persisted Finance refund mutation.

### 9.9 Required behavior and characterization matrix

Orders:

- paid cancellation commit menghasilkan cancelled/refunded Order, tepat satu canonical
  refund projection, dan tepat satu Inventory reversal;
- unpaid cancellation tidak menghasilkan refund atau reversal;
- setiap failure sebelum transaction commit mengembalikan `dataChanged: false`;
- injected failure setelah satu mutation membuktikan rollback Order dan Inventory;
- retry setelah failure atau success tidak menggandakan effect;
- not-found dan invalid transition tetap tidak bermutasi;
- tests memverifikasi actual port invocation/identity, bukan menghitung projection lain
  yang tidak dipakai command.

POS:

- open/restore/close session dan route remount/reload semantics;
- deterministic cart, variants, pricing, receipt, dan cash change;
- expected/actual/variance tetap sama;
- checkout menghasilkan tepat satu Order;
- Inventory consumption tepat satu ketika berhasil;
- failure setelah Order persist membuat satu pending sync entry; retry idempotent,
  menghapus pending hanya setelah consume berhasil;
- double submit/overlap tidak membuat duplicate Order;
- corrupt/mismatched session storage pulih aman.

Inventory:

- read/material/movement behavior tidak berubah;
- unit conversion, balance, recipe, HPP, missing recipe/cost tetap sama;
- consume/reverse idempotent;
- HPP membaca Catalog melalui injected `catalog.read`, bukan Menu repository import.

Finance:

- ledger direction/status/summaries tetap sama;
- refund amount/reference uniqueness berasal dari canonical Order projection;
- manual transaction create/update/void tetap sama;
- Finance order-derived reads memakai injected Order read capability/port;
- tidak ada direct import ke Orders repository singleton.

Architecture/lifecycle:

- manifest declaration sama dengan capability yang benar-benar didaftarkan;
- registry resolve mengembalikan exact composition-owned implementation;
- dispose/reinitialize/StrictMode tidak meninggalkan stale capability/storage binding;
- separate Admin runtimes tidak berbagi repository, transaction state, POS session store,
  atau capability implementation;
- module registration failure melepaskan semua capability milik module itu;
- removal of each protected command/adapter membuat characterization test gagal;
- zero direct internal cross-feature repository import untuk Phase 04 cluster.

### 9.10 One final QA and supervisor closure

Writer/executor:

- tidak menjalankan `test`, `lint`, `typecheck`, `build`, AntD lint, atau browser QA;
- tidak mengedit Evidence/Ledger/status closure;
- tidak commit atau push;
- menyerahkan exact files, capability graph, transaction/storage semantics, consumer scan,
  dan unresolved blockers sekali setelah seluruh Phase 04 implementation selesai.

Codex supervisor menjalankan QA **sekali** setelah handoff:

1. diff/allowlist/forbidden/import-boundary review; findings tetap dipisahkan per
   capability/module untuk traceability, tetapi menghasilkan satu final Phase 04 verdict;
2. focused capability, transaction, Orders, POS, Inventory, Finance, runtime lifecycle,
   dan route injection tests;
3. full gate §3.3;
4. Admin AntD lint;
5. browser critical-flow matrix dengan Admin fluid desktop-first sweep sesuai §3.4:
   - Orders list/detail, paid/unpaid cancellation, reload;
   - POS open/restore/checkout/pending-sync retry/close;
   - Inventory HPP load/error/retry;
   - Finance overview/transactions/expenses;
   - console errors, focus, and horizontal overflow;
6. post-QA `git status`, artifact cleanup, Evidence/Ledger update, dan one final verdict.

Phase 04 `PASS` membutuhkan seluruh matrix §9.9, automated gate, dan browser evidence.
Commit checkpoint hanya dilakukan setelah PASS dan instruksi commit user. Tidak ada
partial module commit dalam Phase 04 replan.

### 9.11 Fallback and handoff

Fallback dilakukan melalui normal source edits:

- capability route adapter dapat dikembalikan ke feature compatibility prop selama
  canonical capability implementation tetap satu;
- failed module registration tidak boleh menghapus repository/data runtime module lain;
- transaction failure harus rollback, bukan mengembalikan half-applied success;
- storage failure jatuh ke memory/clean-session behavior tanpa crash;
- legacy wrapper tidak dihapus sebelum replacement consumer tests ada;
- jangan memakai `git reset`, `git clean`, forced checkout, test deletion, atau contract
  weakening.

Jika hard blocker tersisa, executor tetap menyelesaikan work package independen di dalam
allowlist lalu menyerahkan satu Phase 04 handoff dengan:

- blocker location dan exact missing contract;
- source yang sudah wired;
- source yang belum boleh cut over;
- safe next action;
- no false PASS dan no ledger advancement.

Setelah final Phase 04 PASS, minta approval user sebelum Phase 05 Storefront.

## 10. Phase 05 — Storefront Registry and Composition

### 10.1 Execution contract

| Field            | Value                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Phase ID         | 05                                                                                                                           |
| Status           | `PENDING`                                                                                                                    |
| Objective        | Membuat Storefront registry/composition terpisah dan mendaftarkan Catalog, Cart, Checkout, serta Order Confirmation bertahap |
| Surface          | Storefront                                                                                                                   |
| Module owner     | Satu active Storefront sub-wave                                                                                              |
| Preconditions    | Phase 04 PASS; separate Storefront registry; current public routes locked                                                    |
| Current behavior | BrowserRouter + centralized routes/providers; cross-feature internal imports                                                 |
| Target contract  | Storefront-only runtime; composition-owned adapters; manifest routes; narrow public contracts                                |
| Stop condition   | Automated gates + required browser parity + supervisor review                                                                |
| Evidence path    | Wave 05 row per module + Cutover Log                                                                                         |

### 10.2 Naming decision

Untuk menghilangkan konflik target diagram vs ledger:

- physical folder tetap `apps/storefront/src/features/orders/`;
- routed screen tetap `OrderConfirmationScreen`;
- stable module ID wajib `storefront.order-confirmation`;
- folder rename ke `features/order-confirmation/` ditunda;
- target-tree folder adalah conceptual module name, bukan move authorization.

Keputusan ini mengikuti ledger terbaru dan menghindari move churn yang tidak memberi
behavior benefit.

### 10.3 Sub-wave order

1. **05A Storefront runtime + Catalog pilot**
2. **05B Cart**
3. **05C Checkout**
4. **05D Order Confirmation**

Satu sub-wave aktif dan direview pada satu waktu.

### 10.4 Cross-feature coupling strategy

Aturan resolusi:

- concrete catalog/order/storage adapters dibuat di composition root;
- new/migrated feature code tidak boleh mengimpor internal sibling;
- application types/operations yang perlu lintas feature diekspor sebagai narrow public
  feature application contract atau registered capability;
- UI component yang tetap dimiliki Catalog dipakai melalui public Catalog contract atau
  dinaikkan ke parent composition;
- `@warungmeng/ui-storefront` hanya dipakai jika presentational reuse lintas feature
  terbukti dan ledger target diperbarui;
- `@warungmeng/domain` hanya menerima pure business invariant dengan approval contract
  terpisah;
- `QuantityStepper` tetap di Catalog pada Phase 05; tidak dipindahkan secara spekulatif;
- existing internal imports boleh hidup sebagai compatibility bridge, tetapi rows
  terkait tidak boleh `verified` sampai bridge hilang.

Full replacement atas coupling yang masih tersisa menjadi input Phase 06, bukan alasan
menyembunyikan status `wired` sebagai `verified`.

### 10.5 Allowed files

Storefront runtime:

```text
apps/storefront/package.json
package-lock.json
apps/storefront/src/App.tsx
apps/storefront/src/app/ApplicationProviders.tsx
apps/storefront/src/app/AppRoutes.tsx
apps/storefront/src/app/AppRoutes.test.tsx
apps/storefront/src/app/composition/**
apps/storefront/src/app/discovery/**
apps/storefront/src/app/routing/**
apps/storefront/src/app/providers/**
apps/storefront/src/tests/storefrontModuleDiscovery.test.ts
apps/storefront/src/tests/storefrontRouteContributions.test.tsx
apps/storefront/src/tests/storefrontImportBoundary.test.ts
```

Active module:

```text
apps/storefront/src/features/<active-module>/manifest/**
apps/storefront/src/features/<active-module>/index.ts
apps/storefront/src/features/<active-module>/application/**
apps/storefront/src/features/<active-module>/screens/*Screen.tsx
apps/storefront/src/features/<active-module>/screens/*Screen.test.tsx
```

For Order Confirmation, `<active-module>` adalah current physical folder `orders`.

Components hanya boleh ditambahkan ke allowlist satu per satu jika callback injection
tidak dapat dilakukan pada screen/controller. CSS tidak termasuk default allowlist.

### 10.6 Forbidden files

```text
apps/admin/**
apps/storefront/src/**/*.css
apps/storefront/src/components/layout/**
apps/storefront/src/features/<non-active-module>/**
packages/domain/**
packages/data/**
packages/i18n/**
packages/ui-admin/**
packages/ui-storefront/**
packages/module-system/**
package.json
tsconfig.base.json
eslint.config.ts
vitest.config.ts
```

`storefrontTheme.ts`, visible layout, copy, dan CSS hanya boleh berubah melalui approved
UI amendment dengan expanded browser evidence.

### 10.7 Per-sub-wave contract and tests

#### 05A Catalog pilot

Compatibility path:

```text
Storefront composition
  → injected catalog repository
  → catalog extension (`catalog.read/configure`)
  → existing catalog controllers/screens
  → existing `/` and `/menu/:menuSlug`
```

Required parity:

- loading/error/retry/empty/search/category;
- menu detail deep link/not-found;
- visibility, availability, variants, notes, quantity;
- add/configure callback behavior;
- repository identity across rerender.

#### 05B Cart

Required parity:

- add/edit/remove/clear;
- local persistence and reload;
- totals and invalid-item reconciliation;
- public Cart contract replaces new Catalog→Cart internal imports;
- `/cart` route and menu-detail configuration remain stable.

#### 05C Checkout

Precondition:

- tambahkan submission-lock characterization test;
- buktikan test gagal ketika lock dihapus;
- double click/rapid submit menghasilkan satu repository create call.

Required parity:

- customer/form validation;
- pickup/cash behavior;
- submission disabled/lock;
- failure/retry tidak menggandakan order;
- cart hanya clear setelah success;
- recent receipt persistence;
- TD-SF-02 `idempotencyKey` tetap out of scope karena membutuhkan domain/data contract
  approval.

#### 05D Order Confirmation

Required parity:

- route `/orders/:orderId`;
- safe refresh dari recent session receipt;
- matching/mismatching order ID;
- status/items/totals/actions;
- not-found behavior;
- receipt storage dan order read melalui public contract/composition adapter;
- module ID `storefront.order-confirmation`.

### 10.8 Validation and browser scenarios

Per sub-wave:

- target tests;
- Storefront workspace typecheck/build;
- full gate §3.3;
- Storefront AntD lint;
- browser fluid mobile-first sweep sesuai §3.4.

Phase closure:

- route smoke seluruh Storefront sepanjang fluid mobile-first sweep §3.4;
- keyboard/focus;
- loading/error/retry/not-found;
- horizontal overflow;
- console errors;
- critical journey Catalog → configure → Cart → Checkout → Order Confirmation.

No visual PASS tanpa evidence sesi aktif.

### 10.9 Success, fallback, and handoff

Success:

- Storefront memakai registry/composition yang terpisah dari Admin;
- route URLs, BrowserRouter behavior, i18n, Rupiah, single outlet, storage, dan visible
  UI parity;
- Catalog, Cart, Checkout, dan Order Confirmation terdaftar deterministic;
- cross-feature rows dilaporkan jujur sebagai `wired` atau `verified` sesuai evidence;
- no physical folder rename dan no speculative shared-package move.

Fallback:

- existing `ApplicationProviders` dan `AppRoutes` tetap compatibility path;
- sub-wave yang gagal kembali memakai current repository/storage wiring;
- target registration dinonaktifkan dari Storefront composition;
- legacy path tidak dihapus.

Stop: supervisor review, evidence update, final git-safety report, dan user decision
sebelum Phase 06.

## 11. Canonical Migration Map (Phase 01–05)

| Current owner                   | Target owner                                             | Action     | Compatibility/removal condition                              |
| ------------------------------- | -------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| No module-system                | `@warungmeng/module-system`                              | Add        | Tidak direferensikan app sampai Phase 01 PASS                |
| Admin `App.tsx` wiring          | Admin composition/runtime/provider                       | Split      | Existing provider order retained until Dashboard parity      |
| Dashboard repository singletons | Admin composition-owned repositories + Dashboard port    | Adapt      | Wrapper remains until all Dashboard consumers migrate        |
| Admin `navigation.tsx`          | Feature nav contributions + resolver                     | Split      | Legacy entries remain per unverified module                  |
| Admin `AppRoutes.tsx`           | Route contributions + app-local component registry       | Split      | Legacy routes remain until all route rows verified           |
| Admin cross-feature singletons  | Active feature ports/capabilities + composition adapters | Adapt      | Retire only after consumer graph empty                       |
| Storefront providers            | Storefront composition/runtime/provider                  | Split      | Existing provider remains rollback path                      |
| Storefront routes               | Feature route contributions + Storefront resolver        | Split      | Public URLs unchanged; legacy resolver retained until parity |
| Catalog repository singleton    | Composition-owned adapter + catalog port                 | Adapt      | Existing export delegates during compatibility window        |
| Catalog↔Cart internal imports   | Public feature application contracts/capabilities        | Adapt      | Remaining bridge rows stop at `wired`                        |
| Checkout order repository       | Composition-owned adapter + checkout port                | Adapt      | No domain contract change                                    |
| Recent receipt storage          | Composition-owned storage binding/current wrapper        | Keep/adapt | Preserve current session key and serialization               |
| Physical `features/orders/`     | Same folder, module ID `storefront.order-confirmation`   | Keep       | Folder rename deferred; semantic module identity used        |

## 12. Evidence and Handoff Requirements

Setiap module/sub-wave handoff wajib memuat:

```text
Phase:
Module/sub-wave:
Baseline HEAD:
Allowed files actually changed:
Forbidden-file check:
Ledger rows:
Compatibility path:
Characterization tests:
Fail-on-removal proof:
Commands and exact outcomes:
Browser fluid mode/sweep/scenarios/evidence:
Reviewer findings:
Ledger status approved:
Legacy consumers remaining:
Rollback/remediation:
Final git status:
Commit/push performed: yes/no + explicit authorization
Next safe action:
```

Evidence kosong tidak berarti PASS. Command lama tidak dianggap gate baru. Supervisor
mencatat verdict dan evidence path di `MODULAR-MIGRATION-EVIDENCE.md` sebelum status
ledger berubah.

## 13. Definition of Done for This Plan

Plan ini selesai sebagai dokumen jika:

- Phase 01–05 masing-masing memiliki objective, scope, allowlist, denylist, tests,
  validation, browser requirement, compatibility path, success, fallback, stop, dan
  evidence contract;
- TS signatures Phase 01 tidak memiliki React/AntD/CSS/browser/business-domain
  dependency;
- Dashboard dan Catalog pilot mempunyai alasan serta bounded scope;
- dua Phase 00 test gaps ditempatkan pada phase pemilik yang benar;
- Phase 04 membuktikan atomicity/idempotency per bounded sub-wave;
- Phase 05 menyelesaikan naming decision dan tidak mempromosikan shared code secara
  spekulatif;
- tidak ada execution authority tersirat.

Plan execution tetap membutuhkan approval user untuk Phase 01 dan sign-off pada setiap
stop-gate berikutnya.
