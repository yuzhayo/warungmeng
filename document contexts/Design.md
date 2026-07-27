# Warung Meng â€” DESIGN.md

> Fokus: sistem desain UI aktual (admin + storefront) dan aturan presentasi target
> modular (marker `[UI]`, `[SCREEN]`, `[COMP]` dari `TARGET-FILE-TREE.md`).

> Audited from live checkout: 24 Juli 2026.
> Dokumen ini merangkum current implementation dan target responsibility; bukan
> pengganti source code atau browser evidence terbaru.

## 1. Dua Bahasa Desain Terpisah

| Surface                        | UI Kit                                      | Style approach                                                   | Catatan                                                             |
| ------------------------------ | ------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| Admin (`apps/admin`)           | Ant Design 6                                | Theme token via `@warungmeng/ui-admin`                           | Dashboard/operational console                                       |
| Storefront (`apps/storefront`) | Ant Design 6 + storefront-local composition | `ConfigProvider`, `storefrontTheme`, dan CSS Modules per feature | Mobile-first customer catalog; tidak memakai `@warungmeng/ui-admin` |

Aturan keras (Import Contract): **admin tidak boleh import storefront, storefront tidak
boleh import admin.** `ui-admin` dan `ui-storefront` adalah dua paket UI terpisah.

Storefront saat ini bergantung pada `antd` dan menggunakan antara lain `Button`, `Card`,
`Form`, `Drawer`, `Tabs`, `Modal`, `Result`, `Skeleton`, `ConfigProvider`, dan
`AntdApp`. Pemisahan surface berarti theme dan reusable UI package-nya terpisah dari
Admin, bukan berarti Storefront bebas AntD.

## 2. Admin Theme System (`@warungmeng/ui-admin`)

File kunci:

- `AdminUiProvider.tsx` â€” provider utama yang membungkus AntD `ConfigProvider`.
- `adminTheme.ts` â€” entry theme default.
- `theme/createAdminTheme.ts` â€” factory pembuat AntD theme token dari pengaturan.
- `theme/themeDefaults.ts` â€” token/preset bawaan.
- `theme/themeContrast.ts` â€” validasi kontras warna (a11y).
- `theme/themeRandomizer.ts` â€” generator tema acak (**ditunda pemakaiannya** di
  produk â€” lihat `ROADMAP.md`: "Randomizer dan import/export tema tetap ditunda").
- `theme/themeSerialization.ts` â€” serialisasi tema untuk disimpan.
- `theme/themeStorage.ts` â€” persistence tema (browser storage).
- `theme/themeTypes.ts` â€” kontrak tipe tema.

Fitur produk terkait: **Theme Settings** (`/settings/theme`) â€” mode built-in/custom,
draft, Save/Cancel/Reset. Known debt (TD-001): live preview belum terisolasi penuh dari
theme aktif.

## 3. Navigation & Layout (Admin) â€” Current

Layout: `AdminShell` (parent) â†’ `AdminHeader`, `AdminSidebar` (collapsible).
Navigasi didefinisikan terpusat di `apps/admin/src/app/navigation.tsx`:

| Route key    | Label key i18n                              |
| ------------ | ------------------------------------------- |
| `/`          | `navigation.performance` (Dashboard/Report) |
| `/menu`      | `navigation.menu`                           |
| `/finance`   | `navigation.finance`                        |
| `/inventory` | `navigation.inventory`                      |
| `/pos`       | `navigation.pos`                            |
| `/orders`    | `navigation.orders`                         |
| `/settings`  | `navigation.settings`                       |

Keputusan produk: Dashboard/Report tetap top-level; HPP **tidak** punya nav sendiri
(bagian dari Inventory); POS Kasir modul & nav tersendiri.

Target modular: navigasi ini akan berasal dari `resolveAdminNavigation.ts` (view model)
yang membaca kontribusi manifest tiap feature â€” bukan file terpusat manual.

## 4. Storefront Design â€” Current

Storefront memakai AntD 6 untuk component behavior dan CSS Module untuk layout/presentasi
feature-specific. File style utama:
`StorefrontCatalog.module.css`, `MenuDetail.module.css`, `Cart.module.css`,
`Checkout.module.css`, `OrderConfirmation.module.css`.

QA storefront sudah diverifikasi di dua breakpoint: **375Ã—812 (mobile)** dan
**1024Ã—768 (tablet/desktop)** â€” lihat `STOREFRONT-MVP-QA-REPORT.md` (36 overflow
checkpoint, Playwright 1.61.1). Known debt kecil: TD-SF-01, `font-size: 0.75rem`
hardcoded di 4 lokasi / 3 file (belum pakai `var(--ant-font-size-sm)`).

## 5. i18n & Formatting (Shared)

- `@warungmeng/i18n`: `WarungMengI18nProvider`, bilingual **Indonesia/English**.
- Paritas key ID/EN dijaga otomatis oleh test (`translations.test.ts`) â€” **jangan
  hapus test ini**, ini pagar anti-regresi bilingual.
- `formatters.ts`: format Rupiah dan lainnya â€” karakteristik ini termasuk daftar
  "Existing Behavior Protection" yang wajib punya characterization test sebelum
  dipindah dalam refactor modular.

## 6. Component Responsibility Marker (Target)

Dari `TARGET-FILE-TREE.md`, setiap file UI di masa depan diberi
tag tanggung jawab:

| Marker     | Arti                                                                       |
| ---------- | -------------------------------------------------------------------------- |
| `[UI]`     | React/AntD presentational, hanya AntD, CSS, focus, visual state            |
| `[SCREEN]` | Route-level composition parent â€” tidak boleh membuat concrete repository |
| `[HOOK]`   | React lifecycle adapter (controller) â€” bridging ke application layer     |
| `[COMP]`   | Composition root â€” providers + runtime + router saja                     |

Child rules penting untuk desain komponen:

1. Component tidak boleh import screen.
2. Screen tidak boleh membuat concrete repository sendiri.
3. Props membawa view model + callback â€” **bukan** mutable repository.
4. Shell menerima navigation view model siap-render, bukan raw manifest.

Aturan tersebut adalah target untuk file baru atau file yang sudah masuk migration
slice. Existing code yang belum memenuhi target dicatat di migration ledger; jangan
melakukan rewrite massal hanya untuk menyamakan bentuk folder.

## 7. Desain yang Sengaja Ditunda (Deferred by Design, bukan Debt)

Dari `ROADMAP.md` dan `TECHNICAL-DEBT.md` â€” jangan desain ulang area ini tanpa approval:

- Auth/role UI, multi-outlet selector.
- Delivery address/zone/fee/ETA UI di storefront.
- Payment gateway UI/callback.
- Business Hours enforcement di storefront.
- SEO/SSR/prerendering.
