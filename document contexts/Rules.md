# Warung Meng â€” RULES.md

> Diringkas dari `TARGET-FILE-TREE.md` (section 6, 7, 10, 11, 12) dan
> `MODULAR-REFACTOR-PROMPT.md` (Guardrails, Naming Contract,
> Existing Behavior Protection). Ini kontrak yang **wajib** dipatuhi agent/dev saat
> mengerjakan Warung Meng, baik kode existing maupun refactor modular.

## 0. Applicability and Precedence

Urutan authority:

1. instruksi user untuk task aktif;
2. `CLAUDE.md` dan nearest `AGENTS.md`;
3. live source/tests/configuration;
4. canonical roadmap dan active phase plan;
5. dokumen context ini.

Target import, naming, dan parentâ€“child rules berlaku langsung untuk scaffold/file baru
serta file yang sudah masuk vertical migration slice. Existing path yang belum sesuai
tidak boleh dirombak massal; catat sebagai migration row dan pertahankan behavior sampai
cutover terverifikasi.

## 1. Import Contract

**Diizinkan:**

```text
apps/*/app          â†’ feature public entry
feature manifest     â†’ module-system contracts + i18n key types
feature extension    â†’ module-system contracts + feature application public contract
feature screen       â†’ same-feature application/components
feature application  â†’ domain + repository/capability ports
data                 â†’ domain
ui-admin/ui-storefront â†’ React/AntD dan kontrak publik masing-masing
```

**Dilarang:**

```text
admin â†’ storefront
storefront â†’ admin
domain â†’ data/app/UI/module runtime
component â†’ repository/concrete adapter/manifest registry
manifest â†’ React/AntD/screen/concrete adapter
feature A â†’ feature B internal path (harus lewat capability/public contract)
shared package â†’ apps/*
module-system â†’ Warung Meng business domain atau React
```

## 2. Child Rules (Parentâ€“Child Contract)

1. Child tidak boleh import parent yang merendernya.
2. Component tidak boleh import screen.
3. Screen tidak boleh membuat concrete repository sendiri.
4. Manifest tidak boleh import screen atau AntD.
5. Extension boleh mereferensikan public registration factory, bukan internal UI.
6. Sibling feature tidak boleh import internal sibling lain.
7. Shared coordination dinaikkan ke capability contract atau composition root.
8. Props membawa view model dan callback â€” bukan mutable repository.

## 3. Naming Contract

| Elemen                | Konvensi                                      |
| --------------------- | --------------------------------------------- |
| Komponen React & file | `PascalCase`                                  |
| Hook                  | prefix `use`                                  |
| Factory               | prefix `create`                               |
| Command               | verb + object, contoh `cancelOrderCommand.ts` |
| Presenter             | suffix `Presenter`                            |
| View model type       | suffix `ViewModel`                            |
| Port                  | capability + `Port`                           |
| Concrete adapter      | mechanism + capability + `Adapter`            |
| Manifest              | `<feature>Manifest.ts`                        |
| Extension             | `<feature>Extension.ts`                       |
| Registry              | `<surface>ModuleRegistry.ts`                  |
| Stable module ID      | namespaced lowercase dot notation             |

**Hindari** nama generik kecuali ownership benar-benar jelas: `utils.ts`, `helpers.ts`,
`common.ts`, `misc.ts`, `manager.ts`, `engine.ts`, `service.ts`.

## 4. Existing Behavior Protection

Sebelum memindahkan production code, wajib urutan ini:

1. Petakan route, screen, provider, repository instance, storage, cross-feature import.
2. Jalankan baseline validation.
3. Catat kegagalan existing (jangan disembunyikan).
4. Tambahkan characterization test untuk behavior penting yang belum terlindungi.
5. Buktikan test **gagal** jika behavior yang diklaim dilindungi dihapus.
6. Buat migration map.
7. Pisahkan rename/move dari perubahan behavior â€” jangan digabung satu commit.
8. Jangan sentuh source sebelum phase plan disetujui.

Characterization minimum yang wajib ada:
loading/success/empty/error/retry/not-found Â· route & deep link Â· navigation ID/EN Â·
Rupiah formatting Â· transisi order valid & invalid Â· efek cancel paid/unpaid Â· POS
session/cart/checkout Â· inventory movement & HPP Â· finance aggregation Â·
catalog/category/search/menu detail Â· cart persistence Â· checkout submission lock Â·
recent-order session receipt Â· responsive & keyboard behavior untuk UI yang dipindah.

## 5. Migration Ledger Contract

Setiap current file wajib punya satu baris ledger dengan field:
Current path Â· Current responsibility Â· Current consumers Â· Protected behavior Â·
Target path Â· Migration action (keep/move/split/adapt/replace/delete) Â·
Compatibility path Â· Test evidence Â· Status
(unmapped â†’ mapped â†’ scaffolded â†’ wired â†’ verified â†’ retired).

**Tidak ada legacy file yang boleh dihapus sebelum status row-nya `verified`** dan
seluruh consumer sudah berpindah.

## 6. Scaffold Boundary

**Boleh** dibuat saat scaffold awal:

- `packages/module-system`;
- skeleton composition/discovery/routing admin & storefront;
- folder manifest/extension + public entry tiap current feature;
- architecture test;
- migration ledger.

**Tidak boleh** dilakukan saat scaffold awal:

- menyalin implementation lama jadi duplicate aktif;
- mengubah route atau business behavior;
- mengganti repository contract;
- mengaktifkan remote plugin;
- menghapus current routes/navigation;
- memindahkan seluruh feature sebelum compatibility wiring tersedia.

## 7. Guardrails (Dilarang Sepanjang Refactor)

- Big-bang rewrite.
- Mengubah domain/data contract tanpa approval eksplisit.
- Menambah dependency tanpa approval.
- Memasukkan backend, database, payment, auth, deployment, atau hardware ke phase
  refactor frontend.
- Membuat remote plugin execution.
- Mencampur registry Admin dan Storefront.
- Membuat global mutable service locator.
- Membuat manifest kedua untuk data yang sudah dimiliki domain.
- Memindahkan business rule ke manifest.
- Membuat extension wrapper permanen tanpa removal plan.
- Mengubah route, locale behavior, Rupiah, atau keputusan single-outlet secara diam-diam.
- Memformat file di luar scope.
- Menghapus test agar gate lulus.
- Menonaktifkan lint rule.
- Commit atau push tanpa instruksi eksplisit.
- Memakai reset/clean/forced checkout.
- Mengklaim visual PASS tanpa bukti browser.

## 8. State Ownership (tidak boleh diduplikasi)

| State                             | Owner target                       |
| --------------------------------- | ---------------------------------- |
| Active route                      | Router                             |
| Sidebar collapse & local shell UI | Admin shell                        |
| Module registration status        | Module registry                    |
| Module diagnostics                | Diagnostic collector               |
| Catalog request state             | Catalog controller                 |
| Menu editor draft                 | Menu editor controller             |
| Cart                              | Cart capability/provider           |
| Checkout submission lock          | Checkout controller                |
| Recent receipt                    | Receipt storage adapter            |
| POS session                       | POS capability + storage port      |
| Theme preference                  | Theme capability + storage adapter |
| Locale preference                 | `@warungmeng/i18n`                 |
| Order/inventory/finance records   | Repository adapter                 |
| Business transition rules         | `@warungmeng/domain`               |

State tidak boleh diduplikasi di manifest, registry, screen, dan component sekaligus.

## 9. Operating Mode Setiap Phase

Mulai selalu **read-only audit**. Tentukan/temukan dulu: target surface (admin/storefront
/shared/kombinasi), target module, phase aktif, baseline commit, allowed files,
forbidden files, required validation, dan apakah approval dibutuhkan tiap phase selesai.
Jika scope hanya "refactor Warung Meng", audit seluruh monorepo tapi **jangan ubah
production source** sebelum execution plan disetujui.
