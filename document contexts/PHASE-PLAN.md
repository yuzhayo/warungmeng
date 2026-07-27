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
- viewport dan tanggal.

Required parity pair:

- `375×812`;
- `1024×768`.

Phase 05 closure juga melakukan route smoke pada:

- `320×800`;
- `430×932`;
- `768×1024`;
- desktop `1440×900`.

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
  console, focus, dan overflow pada desktop serta narrow viewport.

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
| Status           | `PENDING`                                                                                       |
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

### 9.1 Execution contract

| Field            | Value                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Phase ID         | 04                                                                                                                             |
| Status           | `PENDING`                                                                                                                      |
| Objective        | Mengganti proven cross-feature singleton imports dengan narrow injected ports/capabilities tanpa mengubah domain/data contract |
| Surface          | Admin                                                                                                                          |
| Module owner     | Satu active sub-wave                                                                                                           |
| Preconditions    | Phase 03 PASS; protected behavior tests tersedia                                                                               |
| Current behavior | Cross-domain workflows memakai app-local concrete repository singletons                                                        |
| Target contract  | Composition-owned adapters + feature commands/ports + stable capability boundary                                               |
| Stop condition   | Setiap sub-wave reviewed; atomicity/idempotency parity lulus                                                                   |
| Evidence path    | Wave 04 block per sub-wave + Cutover Log                                                                                       |

### 9.2 Bounded sub-waves

Satu sub-wave aktif dan direview pada satu waktu:

1. **04A Composition seam**
   - composition root memiliki satu instance setiap current repository;
   - compatibility exports mendelegasikan ke instance yang sama;
   - tidak ada behavior/UI change.
2. **04B Orders cancellation pilot**
   - `orders.manage` memakai narrow Order, Inventory reversal, dan Finance refund ports;
   - ports didelegasikan ke current adapters, sehingga Orders dapat dipilotkan tanpa
     menunggu rewrite Inventory/Finance;
   - paid/unpaid, rollback, invalid transition, dan retry diuji.
3. **04C POS**
   - `pos.session`, cart, checkout, order creation, dan stock consumption melalui ports;
   - browser session storage menjadi explicit app-local adapter.
4. **04D Inventory**
   - `inventory.read/adjust/reverse`;
   - HPP/menu dependency melalui injected catalog port.
5. **04E Finance**
   - `finance.read/record/refund`;
   - order-derived data melalui injected order-read port.

Sub-wave boleh berhenti di `wired` jika consumer internal masih tersisa. Jangan memaksa
`retired` pada Phase 04.

### 9.3 Allowed files

Selalu diizinkan pada active sub-wave:

```text
apps/admin/src/app/composition/createAdminRepositories.ts
apps/admin/src/app/composition/createAdminRuntime.ts
apps/admin/src/app/composition/adminRuntime.ts
apps/admin/src/app/composition/AdminRuntimeProvider.tsx
apps/admin/src/features/<active-module>/manifest/**
apps/admin/src/features/<active-module>/index.ts
apps/admin/src/features/<active-module>/application/**
```

Tambahan exact compatibility owners:

```text
# Orders
apps/admin/src/features/orders/screens/OrderDetailScreen.tsx
apps/admin/src/features/orders/screens/OrderDetailScreen.test.tsx

# POS
apps/admin/src/features/pos/screens/PosCashierScreen.tsx
apps/admin/src/features/pos/screens/PosCashierScreen.test.tsx

# Inventory
apps/admin/src/features/inventory/screens/InventoryHppScreen.tsx
apps/admin/src/features/inventory/screens/InventoryScreens.test.tsx

# Finance
apps/admin/src/features/finance/screens/Finance*.tsx
apps/admin/src/features/finance/tests/**
```

Screen edits hanya boleh mengubah dependency/callback injection. JSX, visible copy, dan
layout tidak boleh berubah tanpa phase amendment serta browser scope tambahan.

### 9.4 Forbidden files

```text
apps/admin/src/app/routing/**
apps/admin/src/app/navigation/**
apps/admin/src/features/<non-active-module>/**
apps/admin/src/features/**/components/**
apps/admin/src/**/*.css
apps/storefront/**
packages/domain/**
packages/data/**
packages/i18n/**
packages/ui-admin/**
packages/ui-storefront/**
packages/module-system/**
```

Contract gap pada `module-system`, domain, atau data membuat phase `BLOCKED`; jangan
mengubah contract secara incidental.

### 9.5 Required parity

Orders:

- paid cancellation menghasilkan tepat satu refund dan reversal;
- unpaid cancellation tidak menghasilkan keduanya;
- partial failure tidak meninggalkan half-applied workflow;
- retry tidak menduplikasi effects;
- invalid transition tetap ditolak.

POS:

- open/restore/close session;
- deterministic cart/pricing;
- expected/actual/variance;
- checkout menghasilkan satu order dan satu stock consumption;
- retry dan failure state.

Inventory:

- unit conversion, stock balance, movement, recipe/HPP;
- consume/revert idempotency;
- missing recipe/cost behavior.

Finance:

- ledger direction, status, summaries;
- refund amount/reference uniqueness;
- manual transaction behavior.

Setiap characterization test harus dibuktikan gagal jika behavior yang dilindungi
dihilangkan.

### 9.6 Validation, fallback, and handoff

Per sub-wave:

- target tests;
- full gate §3.3;
- Admin AntD lint;
- browser critical screen/flow jika screen injection berubah.

Fallback:

- current singleton compatibility wrapper tetap tersedia;
- composition binding dikembalikan ke current implementation;
- failure dicatat tanpa menghapus target/legacy source;
- no ledger advancement beyond evidence.

Stop setelah setiap sub-wave untuk supervisor verdict. Setelah 04E, lakukan Phase 04
summary review dan minta approval user sebelum Storefront.

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
- browser parity pair `375×812` dan `1024×768`.

Phase closure:

- route smoke seluruh Storefront pada expanded viewport matrix §3.4;
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
Browser viewport/scenarios/evidence:
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
