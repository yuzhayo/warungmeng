# Warung Meng Ã¢â‚¬â€ PRD.md

> Sumber utama: `PRD.md` (produk) + `PRD.md` (storefront) +
> `MODULAR-REFACTOR-PROMPT.md` (mission arsitektur, bukan
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
- HPP bukan nav sendiri Ã¢â‚¬â€ bagian dari Inventory.
- POS Kasir = nav dan modul tersendiri.
- Admin **single-outlet** (`wm-1`); multi-outlet & outlet selector ditunda.
- Auth & role ditunda; admin awal diamankan via **IP whitelist**.
- Storefront tetap publik Ã¢â‚¬â€ **tidak** boleh ikut di balik IP whitelist admin.
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
| Storefront (customer)         | Phase 00Ã¢â‚¬â€œ06 selesai Ã¢â‚¬â€ **MVP closed**; grid catalog diseragamkan pada `09ad95a` | port 3001                                                         | Lihat TD-SF-01..06                                               |

## 4. Behavior Bisnis Penting (jangan hilang saat refactor)

- Pembatalan pesanan **paid** Ã¢â€ â€™ otomatis refund Finance + reversal Inventory, **atomik
  dan idempotent**.
- Pembatalan pesanan **unpaid** Ã¢â€ â€™ dibatalkan tanpa refund/reversal.
- POS: sesi kasir persisten lintas route + rekonsiliasi kas (expected vs actual vs selisih)
  saat tutup sesi.
- Paritas key i18n ID/EN dijaga test otomatis.
- Rupiah formatting konsisten via `@warungmeng/i18n`.
- Admin dipin ke outlet tunggal `wm-1` (data mock outlet kedua sudah dihapus).

## 5. Technical Debt Terbuka (Storefront)

| ID       | Area        | Deskripsi                                       | Dampak                                                                        |
| -------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| TD-SF-01 | CSS         | `font-size: 0.75rem` hardcoded (4 occurrence / 3 file) | Tidak ikut perubahan tema AntD font-size                                      |
| TD-SF-02 | Checkout    | Tidak ada idempotency key di `CreateOrderInput` | Order duplikat mungkin terjadi kalau create sukses tapi response hilang       |
| TD-SF-03 | Checkout    | `submissionLockRef` pakai ref, bukan state      | Race condition kecil saat unmount di tengah submit                            |
| TD-SF-04 | QA          | Ã¢â‚¬â€                                               | **Resolved**: Playwright 1.61.1, 36 checkpoint, 375Ãƒâ€”812 & 1024Ãƒâ€”768            |
| TD-SF-05 | Persistence | Tidak ada backend sync                          | Order hilang saat restart server; receipt terakhir bertahan di sessionStorage |
| TD-SF-06 | Checkout    | Tidak ada payment/delivery/auth                 | Placeholder: nama customer + cash-on-pickup saja                              |

## 6. Deferred by Design (bukan debt Ã¢â‚¬â€ jangan "diperbaiki" tanpa approval)

- Autentikasi customer & riwayat pesanan.
- Delivery address/zone/fee/ETA.
- Payment gateway & callback.
- Business Hours enforcement di storefront.
- SEO/SSR/prerendering.
- Production hosting, domain split, observability.

## 7. Relasi ke Refactor Modular

Mission refactor (`MODULAR-REFACTOR-PROMPT.md`) **bukan**
perubahan scope produk Ã¢â‚¬â€ target eksplisit menyatakan: _"Target ini bukan izin untuk
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


## 9. Roadmap & Eksekusi Lanjutan

### 7. Konsolidasi Shared Domain dan Data Contract

- Audit logic yang sudah terbukti dipakai oleh minimal dua aplikasi.
- Pindahkan kontrak stabil ke shared packages secara bertahap:
  - menu dan category;
  - variant dan selection rule;
  - business hours;
  - pricing dan tax;
  - order dan payment;
  - inventory dan finance.
- Pertahankan UI component admin dan storefront di package berbeda.
- Buat repository interface untuk setiap domain.
- Pisahkan mock adapter dari future HTTP adapter.
- Tetapkan error contract, pagination contract, filter contract, dan timestamp format.
- Tambahkan schema validation di boundary menggunakan Zod.
- Hindari refactor besar sekaligus; migrasikan per feature dengan regression tests.

Definition of done:

- Admin, POS, dan storefront tidak memiliki model bisnis yang saling bertentangan.
- Mock repository dapat diganti HTTP repository tanpa menulis ulang screen.
- Shared package tidak mengimpor code dari aplikasi.

### 8. Backend dan Database

- Pilih backend setelah admin dan customer flow stabil.
- Tetapkan kebutuhan database dari domain contract yang sudah digunakan.
- Buat schema awal:
  - outlets;
  - menu categories dan menu items;
  - variant groups dan options;
  - business hours dan special schedules;
  - orders dan order items;
  - payments dan settlements;
  - ingredients, recipes, dan stock movements;
  - finance transactions.
- Buat API versioning dan migration strategy.
- Implementasikan media storage untuk foto menu.
- Implementasikan endpoint per repository interface.
- Tambahkan idempotency untuk create order dan payment callback.
- Tambahkan realtime/polling untuk pesanan masuk.
- Migrasikan mock repository ke HTTP adapter feature per feature.
- Pertahankan mock adapter untuk development dan test.

Definition of done:

- Admin, POS, dan storefront memakai data persistent melalui API.
- Tidak ada business rule penting yang hanya hidup di UI.
- Migration, seed, backup, dan restore sudah diuji.

### 9. Akses Admin dan Keamanan Awal

- Auth dan role tetap ditunda sesuai keputusan sekarang.
- Pisahkan domain/subdomain admin dan storefront.
- Terapkan IP whitelist pada admin UI dan admin API melalui reverse proxy, firewall, atau provider hosting.
- Pastikan storefront dan public order API tidak ikut terblokir whitelist.
- Simpan secret hanya di environment server.
- Terapkan HTTPS, security headers, rate limiting, dan request size limit.
- Catat operasi sensitif melalui audit log teknis meskipun belum ada identitas user lengkap.
- Dokumentasikan prosedur penambahan/penghapusan IP.
- Evaluasi ulang auth jika admin perlu diakses dari jaringan dinamis, perangkat mobile, atau lebih dari satu staf.

Definition of done:

- Admin tidak dapat diakses dari IP di luar allowlist.
- API internal tidak dapat dilewati dengan mengakses endpoint secara langsung.
- Storefront tetap dapat diakses publik.

### 10. Pembayaran dan Integrasi Operasional

- Pilih payment provider berdasarkan kebutuhan transaksi nyata.
- Implementasikan payment intent, callback/webhook, reconciliation, dan refund.
- Tambahkan printer receipt atau print-friendly document.
- Tambahkan notifikasi pesanan masuk untuk admin/POS.
- Tambahkan WhatsApp/email hanya setelah template dan event contract stabil.
- Evaluasi integrasi spreadsheet sebagai export/report, bukan database utama.
- Tambahkan image workflow untuk resize, compression, dan validasi foto menu.
- Dokumentasikan failure handling dan retry policy setiap integrasi.

Definition of done:

- Payment callback idempotent dan dapat direkonsiliasi.
- Kegagalan layanan eksternal tidak menghilangkan order.
- Semua integrasi dapat dinonaktifkan melalui configuration.

### 11. Quality, Performance, dan Observability

- Jalankan validation standar pada setiap fase:
  - format;
  - lint;
  - typecheck;
  - unit/component tests;
  - build;
  - AntD lint untuk admin.
- Tambahkan browser QA untuk flow kritis desktop dan mobile.
- Tambahkan end-to-end tests:
  - customer membuat order;
  - order muncul di admin;
  - POS menyelesaikan transaksi;
  - inventory dan finance menerima efek transaksi.
- Tambahkan error boundary dan user-safe error state.
- Tambahkan logging, error monitoring, uptime monitoring, dan performance metrics.
- Storefront route-level code splitting selesai 22 Juli 2026; admin bundle splitting tetap pending.
- Audit accessibility dan keyboard navigation.
- Tetapkan backup schedule, retention, dan restore drill.

Definition of done:

- Critical journey memiliki automated test dan browser evidence.
- Error production dapat dideteksi tanpa menunggu laporan user.
- Backup dapat dipulihkan melalui prosedur yang terdokumentasi.

### 12. Staging, Launch, dan Operasional Production

- Siapkan environment development, staging, dan production.
- Jalankan seed/migration di staging.
- Lakukan UAT untuk admin, POS, dan storefront.
- Verifikasi domain, HTTPS, IP whitelist, webhook, dan media storage.
- Lakukan load test pada katalog, create order, dan dashboard query.
- Buat launch checklist dan rollback plan.
- Deploy production secara bertahap.
- Pantau error, transaksi, payment, dan stock movement setelah launch.
- Dokumentasikan SOP kasir, koreksi pesanan, stock adjustment, dan reconciliation.
- Setelah sistem stabil, evaluasi fitur lanjutan berdasarkan data penggunaan nyata.

Definition of done:

- Seluruh critical flow lulus UAT di staging dan production smoke test.
- Rollback, backup, monitoring, dan incident response siap digunakan.
- Sistem dapat dipakai untuk operasional harian tanpa bergantung pada mock data.

## Deferred Scope

- Authentication dan role-based access control.
- Theme randomizer serta theme import/export.
- Dedicated isolated theme preview yang tercatat di `TECHNICAL-DEBT.md`.
- Multi-tenant atau dukungan bisnis selain Warung Meng.
- Loyalty, voucher kompleks, membership, dan marketing automation.
- Integrasi WordPress/WooCommerce kecuali kemudian ditemukan kebutuhan bisnis yang jelas.

