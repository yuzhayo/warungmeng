# Warung Meng — 05-RULES.md

> Diringkas dari `06-TARGET-FILE-TREE.md` (section 6, 7, 10, 11, 12) dan
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

Target import, naming, dan parent–child rules berlaku langsung untuk scaffold/file baru
serta file yang sudah masuk vertical migration slice. Existing path yang belum sesuai
tidak boleh dirombak massal; catat sebagai migration row dan pertahankan behavior sampai
cutover terverifikasi.

## 1. Import Contract

**Diizinkan:**

```text
apps/*/app          → feature public entry
feature manifest     → module-system contracts + i18n key types
feature extension    → module-system contracts + feature application public contract
feature screen       → same-feature application/components
feature application  → domain + repository/capability ports
data                 → domain
ui-admin/ui-storefront → React/AntD dan kontrak publik masing-masing
```

**Dilarang:**

```text
admin → storefront
storefront → admin
domain → data/app/UI/module runtime
component → repository/concrete adapter/manifest registry
manifest → React/AntD/screen/concrete adapter
feature A → feature B internal path (harus lewat capability/public contract)
shared package → apps/*
module-system → Warung Meng business domain atau React
```

## 2. Child Rules (Parent–Child Contract)

1. Child tidak boleh import parent yang merendernya.
2. Component tidak boleh import screen.
3. Screen tidak boleh membuat concrete repository sendiri.
4. Manifest tidak boleh import screen atau AntD.
5. Extension boleh mereferensikan public registration factory, bukan internal UI.
6. Sibling feature tidak boleh import internal sibling lain.
7. Shared coordination dinaikkan ke capability contract atau composition root.
8. Props membawa view model dan callback — bukan mutable repository.

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
7. Pisahkan rename/move dari perubahan behavior — jangan digabung satu commit.
8. Jangan sentuh source sebelum phase plan disetujui.

Characterization minimum yang wajib ada:
loading/success/empty/error/retry/not-found · route & deep link · navigation ID/EN ·
Rupiah formatting · transisi order valid & invalid · efek cancel paid/unpaid · POS
session/cart/checkout · inventory movement & HPP · finance aggregation ·
catalog/category/search/menu detail · cart persistence · checkout submission lock ·
recent-order session receipt · responsive & keyboard behavior untuk UI yang dipindah.

## 5. Migration Ledger Contract

Setiap current file wajib punya satu baris ledger dengan field:
Current path · Current responsibility · Current consumers · Protected behavior ·
Target path · Migration action (keep/move/split/adapt/replace/delete) ·
Compatibility path · Test evidence · Status
(unmapped → mapped → scaffolded → wired → verified → retired).

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
