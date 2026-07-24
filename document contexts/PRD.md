# Warung Meng — PRD.md

> Sumber utama: `.docs/ROADMAP.md` (produk) + `.docs/TECHNICAL-DEBT.md` (storefront) +
> `warungmeng-plug-and-play-modular-refactor-prompt.md` (mission arsitektur, bukan
> mengubah scope produk).
> Audited from live checkout: 24 Juli 2026; checkout HEAD `a441c0a`; latest
> production-source commit `09ad95a`.

## 1. Tujuan Produk

- Dashboard admin untuk mengelola operasional Warung Meng.
- POS kasir yang memakai katalog dan aturan bisnis **yang sama** dengan admin.
- Storefront customer responsif untuk melihat menu dan membuat pesanan.
- Menyatukan admin, POS, storefront, dan (nanti) backend lewat kontrak domain konsisten.
- Frontend tetap dapat dikembangkan dengan mock repository sebelum backend tersedia.

## 2. Keputusan Produk Kunci (jangan diubah diam-diam)

- Admin dan storefront: satu monorepo, dua aplikasi terpisah.
- Ant Design 6 dipakai oleh Admin dan Storefront. Admin memakai `@warungmeng/ui-admin`;
  Storefront memakai `ConfigProvider`, theme storefront-local, dan CSS Modules serta
  dilarang mengimpor UI khusus Admin.
- UI, application logic, domain model, data adapter dipisahkan secara ketat.
- Fitur dibangun **frontend-first** dengan mock data + repository interface.
- Dashboard/Report tetap navigasi paling atas.
- HPP bukan nav sendiri — bagian dari Inventory.
- POS Kasir = nav dan modul tersendiri.
- Admin **single-outlet** (`wm-1`); multi-outlet & outlet selector ditunda.
- Auth & role ditunda; admin awal diamankan via **IP whitelist**.
- Storefront tetap publik — **tidak** boleh ikut di balik IP whitelist admin.
- Randomizer & import/export tema ditunda sampai kebutuhan tema utama stabil.

## 3. Status Fitur

Baseline product closure berasal dari 22 Juli 2026. Audit context ini dilakukan pada
live checkout 24 Juli 2026; `09ad95a` adalah latest production-source commit yang
teramati. Commit archive/documentation setelahnya tidak dianggap perubahan behavior
produk.

| Area                          | Status                                                                         | Route                                                             | Sisa pekerjaan                                                   |
| ----------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Admin shell, navigation, i18n | Selesai baseline, browser-verified                                             | seluruh admin                                                     | Audit responsive/a11y berkala                                    |
| Menu & kategori varian        | Selesai mock-first, browser-verified                                           | `/menu`, `/menu/variants`                                         | Persistence backend                                              |
| Theme Settings                | Selesai built-in/custom, browser-verified                                      | `/settings/theme`                                                 | TD-001 isolated live preview; randomizer & import/export ditunda |
| Business Hours                | Selesai mock-first (single-outlet)                                             | `/settings/business-hours`                                        | Persistence backend + integrasi storefront/POS                   |
| Manajemen Pesanan             | Selesai; cancel paid = refund + reversal idempotent                            | `/orders`, `/orders/:orderId`                                     | Persistence backend (TD-002 closed)                              |
| POS Kasir                     | Selesai; sesi persisten + rekonsiliasi kas                                     | `/pos`                                                            | Hardware printer/scanner/drawer + persistence (TD-003 closed)    |
| Inventory & HPP               | Selesai; consume/revert idempotent + retry sync                                | `/inventory`, `/inventory/movements`, `/inventory/hpp`            | Persistence, transfer outlet, purchasing (TD-004 closed)         |
| Keuangan                      | Selesai; refund otomatis dari cancel paid                                      | `/finance/overview`, `/finance/transactions`, `/finance/expenses` | Persistence backend + settlement provider (TD-005 closed)        |
| Dashboard & Report            | Selesai; agregasi Order/POS/Finance/Inventory + filter periode                 | `/`, `/reports`                                                   | Tetap mock sampai backend (TD-006 closed)                        |
| Storefront (customer)         | Phase 00–06 selesai — **MVP closed**; grid catalog diseragamkan pada `09ad95a` | port 3001                                                         | Lihat TD-SF-01..06                                               |

## 4. Behavior Bisnis Penting (jangan hilang saat refactor)

- Pembatalan pesanan **paid** → otomatis refund Finance + reversal Inventory, **atomik
  dan idempotent**.
- Pembatalan pesanan **unpaid** → dibatalkan tanpa refund/reversal.
- POS: sesi kasir persisten lintas route + rekonsiliasi kas (expected vs actual vs selisih)
  saat tutup sesi.
- Paritas key i18n ID/EN dijaga test otomatis.
- Rupiah formatting konsisten via `@warungmeng/i18n`.
- Admin dipin ke outlet tunggal `wm-1` (data mock outlet kedua sudah dihapus).

## 5. Technical Debt Terbuka (Storefront)

| ID       | Area        | Deskripsi                                       | Dampak                                                                        |
| -------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| TD-SF-01 | CSS         | `font-size: 0.75rem` hardcoded, 3 lokasi        | Tidak ikut perubahan tema AntD font-size                                      |
| TD-SF-02 | Checkout    | Tidak ada idempotency key di `CreateOrderInput` | Order duplikat mungkin terjadi kalau create sukses tapi response hilang       |
| TD-SF-03 | Checkout    | `submissionLockRef` pakai ref, bukan state      | Race condition kecil saat unmount di tengah submit                            |
| TD-SF-04 | QA          | —                                               | **Resolved**: Playwright 1.61.1, 36 checkpoint, 375×812 & 1024×768            |
| TD-SF-05 | Persistence | Tidak ada backend sync                          | Order hilang saat restart server; receipt terakhir bertahan di sessionStorage |
| TD-SF-06 | Checkout    | Tidak ada payment/delivery/auth                 | Placeholder: nama customer + cash-on-pickup saja                              |

## 6. Deferred by Design (bukan debt — jangan "diperbaiki" tanpa approval)

- Autentikasi customer & riwayat pesanan.
- Delivery address/zone/fee/ETA.
- Payment gateway & callback.
- Business Hours enforcement di storefront.
- SEO/SSR/prerendering.
- Production hosting, domain split, observability.

## 7. Relasi ke Refactor Modular

Mission refactor (`warungmeng-plug-and-play-modular-refactor-prompt.md`) **bukan**
perubahan scope produk — target eksplisit menyatakan: _"Target ini bukan izin untuk
mengubah business behavior, persistence, backend, payment, auth, hardware, atau
dependency secara diam-diam."_ PRD ini tetap jadi acuan scope; refactor hanya mengubah
**cara modul ditemukan dan disusun**, bukan **apa yang dilakukan produk**.

## 8. Acceptance Criteria Refactor

Refactor modular dianggap berhasil hanya jika:

- seluruh current source memiliki row current-to-target pada migration ledger;
- route, UI, CSS, state, storage, repository wiring, i18n, dan test evidence terpetakan;
- protected behavior pada bagian 4 tetap lulus characterization/parity test;
- Admin dan Storefront mempunyai registry/composition root terpisah;
- legacy owner hanya dihapus setelah seluruh consumer berpindah dan row berstatus
  `verified`;
- browser claim hanya dibuat berdasarkan browser evidence sesi aktif.
