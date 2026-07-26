# Warung Meng — Modular Migration Ledger Generation Contract

Status: documentation-only generation contract  
Canonical output: `.docs/MODULAR-MIGRATION-LEDGER.md`  
Target reference: `warungmeng-target-modular-file-tree.md`

Dokumen ini menggantikan generator PowerShell. Isinya menjadi prosedur wajib bagi
agent atau maintainer ketika membuat ulang migration ledger. Dokumen ini bukan
executable dan tidak boleh diperlakukan sebagai production tooling.

## 1. Tujuan

Ledger harus membuktikan bahwa seluruh source UI, application logic, domain logic,
route, state, data adapter, i18n, CSS, dan regression test telah dibandingkan dengan
target Plug-and-Play Modular Control Center Architecture.

Setiap current source file harus muncul tepat satu kali. `mapped` hanya berarti
responsibility dan target awal sudah dicatat; status tersebut bukan bukti parity dan
bukan izin menghapus source lama.

## 2. Source Scope

Inventaris recursive wajib mengambil file `.ts`, `.tsx`, dan `.css` dari:

```text
apps/admin/src
apps/storefront/src
packages/config/src
packages/data/src
packages/domain/src
packages/i18n/src
packages/ui-admin/src
packages/ui-storefront/src
```

Jumlah file harus dihitung ulang dari checkout aktif. Baseline audit 24 Juli 2026
berisi 359 file, tetapi angka tersebut tidak boleh di-hardcode sebagai hasil untuk
checkout berikutnya.

Yang tidak masuk source inventory:

- dependency dan generated output;
- Git internals;
- documentation;
- development tooling;
- asset non-source.

Pengecualian ini hanya berlaku karena item tersebut bukan owner UI atau business
logic. Jika tooling kelak menjadi runtime dependency, scope harus dievaluasi ulang.

## 3. Required Ledger Fields

Setiap row wajib memiliki sepuluh field:

| Field                  | Isi                                                                   |
| ---------------------- | --------------------------------------------------------------------- |
| Current path           | Path source saat ini                                                  |
| Current responsibility | UI, screen, hook, application, domain, data, route, config, atau test |
| Current consumers      | Direct static importers atau runtime caller yang dapat dibuktikan     |
| Protected behavior     | Behavior atau contract yang tidak boleh hilang                        |
| Target path            | Owner pada target modular file tree                                   |
| Migration action       | Keep, move, split, adapt, replace, atau delete                        |
| Compatibility path     | Bridge sementara selama parity window                                 |
| Test evidence          | Existing test atau characterization/parity evidence yang dibutuhkan   |
| Status                 | Unmapped, mapped, scaffolded, wired, verified, atau retired           |
| Wave                   | Phase atau vertical migration owner                                   |

Tidak boleh ada row tanpa target owner atau dengan klasifikasi generik seperti
`requires owner review` pada ledger yang dinyatakan lengkap.

## 4. Responsibility Classification

Klasifikasi dilakukan dari rule paling spesifik menuju fallback:

1. test/spec;
2. owner-local CSS;
3. bootstrap dan composition root;
4. routes, navigation, dan providers;
5. routed screen;
6. feature view dan component;
7. React/application hook;
8. command, repository port/wiring, model, presenter, state, dan storage adapter;
9. pure domain type/rule/calculation;
10. repository contract, fixture, dan concrete data adapter;
11. i18n;
12. reusable Admin atau Storefront UI;
13. shared configuration.

Fallback yang tidak bisa menjelaskan ownership berarti audit belum selesai.

## 5. Consumer Graph

Consumer graph minimum mencakup:

- relative static imports;
- relative re-exports;
- package-entry import `@warungmeng/*`;
- CSS imports dari source TypeScript/TSX.

Resolver harus mencoba file langsung, `.ts`, `.tsx`, `.css`, dan directory
`index.ts`/`index.tsx`.

Static analysis tidak membuktikan:

- dynamic import yang dibangun dari string;
- runtime lookup berdasarkan ID;
- browser-storage coupling;
- CSS selector coupling;
- navigation atau route behavior.

Semua area tersebut tetap memerlukan characterization atau browser evidence sebelum
status `verified`.

## 6. Protected Behavior Rules

Minimal behavior berikut harus dicatat pada owner terkait:

| Area                    | Protected behavior                                                      |
| ----------------------- | ----------------------------------------------------------------------- |
| Routes                  | URL, nesting, redirects, lazy behavior, params, dan not-found           |
| Navigation              | Identity, urutan, label key, grouping, icon mapping, dan active state   |
| UI                      | Content, interaction, accessibility, focus, responsive, visual states   |
| Hooks                   | Async lifecycle, stale response, retry, cleanup, dan state identity     |
| Catalog                 | Visibility, availability, search, detail, variants, notes, dan quantity |
| Cart                    | Add/edit/remove, persistence, validation, totals, dan reconciliation    |
| Storefront checkout     | Validation, submission lock, order input, cart clear, dan receipt       |
| Order confirmation      | Receipt identity, safe refresh, status, totals, dan not-found           |
| Admin orders            | Transition serta paid/unpaid cancellation semantics                     |
| POS                     | Session, pricing, checkout, receipt, dan cash reconciliation            |
| Inventory               | Units, stock, movement, recipe/HPP, consumption, dan reversal           |
| Finance                 | Validation, ledger direction, refund, summaries, dan reconciliation     |
| Reporting               | Period consistency lintas Order/POS/Finance/Inventory                   |
| i18n                    | ID/EN key parity, locale preference, dan Rupiah separators              |
| Repository/data adapter | Public methods, result unions, immutability, async, dan idempotency     |

## 7. Current-to-Target Decisions

Mapping berikut adalah keputusan awal yang harus dipertahankan kecuali target
architecture diubah secara eksplisit:

| Current owner                           | Target owner/action                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| Admin `AppRoutes.tsx`                   | Split menjadi Admin route resolver/rendering plus feature route contributions   |
| Admin `navigation.tsx`                  | Split menjadi navigation resolver plus feature contributions                    |
| Admin `App.tsx`                         | Tetap composition root; runtime assembly dipindahkan ke `app/composition`       |
| Storefront `AppRoutes.tsx`              | Split menjadi Storefront route resolver/rendering plus feature contributions    |
| Storefront `ApplicationProviders.tsx`   | Move ke `app/providers/StorefrontApplicationProviders.tsx`                      |
| Storefront catalog singleton repository | Split menjadi catalog port dan composition-owned repository wiring              |
| Storefront checkout order singleton     | Split menjadi checkout order port dan composition-owned repository wiring       |
| Storefront `features/orders`            | Move ke sibling module `features/order-confirmation`                            |
| `recentOrderReceiptStorage`             | Split menjadi receipt-storage port dan browser adapter milik Order Confirmation |
| Storefront `NotFoundScreen`             | Rename/move menjadi `StorefrontNotFoundScreen`                                  |
| POS browser session storage             | Adapt menjadi explicit browser storage adapter                                  |

Existing source yang sudah berada pada owner feature/application/domain/data yang
benar boleh beraksi `Keep`. `Keep` tidak menghilangkan kewajiban menambahkan manifest,
extension, port, atau compatibility wiring yang tercantum pada target tree.

## 8. Status Transition

```text
unmapped
  → mapped
  → scaffolded
  → wired
  → verified
  → retired
```

Row dilarang melompati parity gate. Source lama hanya boleh dihapus setelah:

1. target owner aktif;
2. seluruh consumer sudah berpindah;
3. required automated tests lulus;
4. browser evidence lulus jika UI/route/interaction terpengaruh;
5. consumer graph diperiksa ulang;
6. ledger row berstatus `verified`.

## 9. Regeneration Procedure

1. Baca `CLAUDE.md`, AGENTS terdekat, context documents, target file tree, dan
   modular refactor prompt.
2. Catat checkout commit dan latest production-source baseline secara terpisah.
3. Enumerasi source scope secara recursive dan urutkan path secara deterministic.
4. Bangun consumer graph dari current checkout.
5. Klasifikasikan responsibility dan protected behavior setiap file.
6. Tentukan target owner dengan membandingkan current path terhadap target tree.
7. Tentukan action, compatibility bridge, evidence requirement, status, dan wave.
8. Tulis ulang seluruh Source Inventory; jangan melakukan partial append yang dapat
   menyisakan row usang.
9. Jalankan coverage, uniqueness, formatting, dan working-tree checks.
10. Laporkan keterbatasan static analysis secara eksplisit.

Prosedur ini hanya boleh mengubah documentation artifacts. Production source tidak
boleh disentuh pada Phase 00.

## 10. Acceptance Checks

Ledger hanya boleh dinyatakan lengkap jika:

- source set checkout dan current-path set ledger identik;
- jumlah row sama dengan jumlah unique current path;
- tidak ada missing, extra, atau duplicate path;
- seluruh row memiliki sepuluh field;
- tidak ada fallback responsibility;
- seluruh initial row memiliki status `mapped`;
- route/navigation matrix sesuai source aktual;
- target paths konsisten dengan target modular file tree;
- protected cross-domain workflow tercatat;
- Markdown formatting lulus;
- `git diff --check` lulus;
- tidak ada tracked production-source diff akibat pekerjaan dokumentasi.

Validasi runtime, typecheck, test, build, atau browser QA hanya boleh dilaporkan jika
benar-benar dijalankan. Dokumentasi yang formatnya valid bukan bukti behavior parity.

## 11. Canonical Output

Hasil generation disimpan hanya di:

```text
.docs/MODULAR-MIGRATION-LEDGER.md
```

File tersebut adalah ledger status migrasi. Dokumen ini adalah generation contract.
Target structure tetap dimiliki oleh `warungmeng-target-modular-file-tree.md`, dan
execution rules tetap dimiliki oleh
`warungmeng-plug-and-play-modular-refactor-prompt.md`.
