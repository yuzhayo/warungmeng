# Storefront Warung Meng — Rencana Implementasi

> Berdasarkan analisis video ShopeeFood (108 frame) + hasil brainstorm.
> Dibuat: 2026-07-20

## 1. Layout & Routing (dari video ShopeeFood)

### Header
- Sticky top
- Logo/nama warung (kiri)
- Search icon (kanan)
- Back button jika dari dalam menu

### Hero Merchant
- Foto/cover merchant
- Nama merchant, rating, estimasi waktu
- Status buka/tutup (dari Business Hours)
- Jarak/lokasi (jika ada)

### Category Navigation
- Horizontal scroll kategori menu (seperti ShopeeFood)
- Kategori dari data: `MenuCategory`
- Active state + indicator

### Menu Grid
- Kartu menu per item
- Gambar, nama, harga
- Tambahkan + varian jika ada
- Availability indicator

### Sticky Bottom Cart
- Muncul jika cart tidak kosong
- Total harga + jumlah item
- Tombol "Lihat Keranjang" → navigasi ke cart

### Routing

```
/                    → StorefrontCatalogScreen (daftar outlet/home)
/outlet/:outletId    → MerchantDetailScreen
/outlet/:outletId/menu/:menuSlug → MenuDetailScreen
/cart                → CartScreen
/checkout            → CheckoutScreen
/orders/:orderId     → OrderDetailScreen
```

Pilihan routing: **B** (outlet sebagai bagian URL)
- Deep linking langsung ke menu/outlet tertentu
- Support multi-outlet sejak awal
- SEO-friendly

### Route Table

| Path | Screen | Params | Notes |
|------|--------|--------|-------|
| `/` | `StorefrontCatalogScreen` | — | Daftar outlet (mock-ready), featured menu |
| `/outlet/:outletId` | `MerchantDetailScreen` | `outletId` | Hero, kategori, menu grid |
| `/outlet/:outletId/menu/:menuSlug` | `MenuDetailScreen` | `outletId`, `menuSlug` | Detail item, varian, add-to-cart |
| `/cart` | `CartScreen` | — | Review cart sebelum checkout |
| `/checkout` | `CheckoutScreen` | — | Form info customer + metode bayar |
| `/orders/:orderId` | `OrderDetailScreen` | `orderId` | Tracking status order |

---

## 2. File Tree Target

```
apps/storefront/src/
├─ app/
│  ├─ AppRoutes.tsx           # Route definitions
│  ├─ navigation.tsx          # Navigation helpers (if needed more than simple route)
│  └─ ApplicationProviders.tsx # Global providers (i18n, router, theme)
├─ components/
│  ├─ layout/
│  │  ├─ StorefrontShell.tsx   # Header + content + optional bottom nav
│  │  ├─ Header.tsx
│  │  └── BottomCartBar.tsx    # Sticky bottom cart summary
│  └─ shared/                  # Cross-feature UI (if reused)
│     └─ PriceDisplay.tsx
├─ features/
│  ├─ catalog/
│  │  ├─ application/
│  │  │  ├─ storefrontCatalogModel.ts  # Pure transformations
│  │  │  └─ useStorefrontCatalog.ts    # Hook for catalog data
│  │  ├─ components/
│  │  │  ├─ MerchantHero.tsx
│  │  │  ├─ CategoryNavigation.tsx
│  │  │  ├─ MenuCard.tsx
│  │  │  └─ MenuGrid.tsx
│  │  └─ screens/
│  │     ├─ StorefrontCatalogScreen.tsx  # Home: outlet list
│  │     └─ MerchantDetailScreen.tsx     # Menu per outlet
│  ├─ menu-detail/
│  │  ├─ application/useMenuDetail.ts
│  │  ├─ components/
│  │  │  ├─ VariantSelector.tsx
│  │  │  └─ AddToCartButton.tsx
│  │  └─ screens/MenuDetailScreen.tsx
│  ├─ cart/
│  │  ├─ application/useCustomerCart.ts
│  │  ├─ components/CartItemRow.tsx
│  │  └─ screens/CartScreen.tsx
│  ├─ checkout/
│  │  ├─ application/useCheckout.ts
│  │  ├─ components/
│  │  │  ├─ CustomerInfoForm.tsx
│  │  │  └─ PaymentMethodSelector.tsx
│  │  └─ screens/CheckoutScreen.tsx
│  └─ orders/
│     ├─ application/useCustomerOrder.ts
│     └─ screens/OrderDetailScreen.tsx
├─ styles/
│  └─ storefront.css           # Small custom CSS (mobile-first)
├─ App.tsx                     # Composition root
└─ main.tsx                    # Bootstrap
```

---

## 3. Shared Package Mapping

| Kebutuhan | Package | Contract |
|-----------|---------|----------|
| Menu types | `@warungmeng/domain` | `MenuCategory`, `MenuItem`, `MenuVariantGroup` |
| Business Hours | `@warungmeng/domain` | `SalesInterval`, `MenuAvailability` |
| Pricing | `@warungmeng/domain` | `Money` |
| Visibility | `@warungmeng/domain` | `MenuVisibility` |
| Inventory policy | `@warungmeng/domain` | `InventoryPolicy` |
| Variant selection | `@warungmeng/domain` | `VariantSelectionRule` |
| Catalog data | `@warungmeng/data` | `MenuCatalogRepository` (+ InMemoryMock) |
| Translations | `@warungmeng/i18n` | `WarungMengI18nProvider`, `translations` |
| UI (jika reusable) | `@warungmeng/ui-storefront` | Saat benar-benar dipakai >1 feature |

---

## 4. Customer Journey

```
Landing → Pilih Outlet → Lihat Menu → Pilih Item + Varian → 
  → Add to Cart → Review Cart → Checkout → Order Confirmation
```

---

## 5. Fase Implementasi

### Fase 1: Shell + Catalog (MINI)
- Install AntD + React Router (done in package.json)
- `app/AppRoutes.tsx`, `ApplicationProviders.tsx`
- `StorefrontShell.tsx` (header + content)
- `StorefrontCatalogScreen.tsx` (daftar outlet/hero)
- `MerchantDetailScreen.tsx` (kategori horizontal + menu grid)
- Mock data via `InMemoryMenuCatalogRepository`

**Checkpoint:** Menu outlet tampil dengan layout mobile-first. ✅

### Fase 2: Menu Detail + Cart
- `MenuDetailScreen.tsx`, `VariantSelector.tsx`
- `useCustomerCart.ts` + cart state (local state, non-persistent)
- `CartScreen.tsx`
- `BottomCartBar.tsx`

### Fase 3: Checkout + Order
- `CheckoutScreen.tsx`, `useCheckout.ts`
- `OrderDetailScreen.tsx`
- Menulis order ke `OrderRepository`

### Fase 4: Polish
- i18n ID/EN
- Empty states, loading, error
- Responsive desktop
- Accessibility

---

## 6. Teknis

### Yang SUDAH tersedia di shared packages:
- **Catalog:** `MenuCatalogRepository`, `InMemoryMenuCatalogRepository`, `WarungMengMockData`
- **Domain:** `MenuItem`, `MenuCategory`, `MenuVariantGroup`, `VariantSelectionRule`, `Money`, `SalesInterval`, `MenuAvailability`, `MenuVisibility`, `InventoryPolicy`
- **i18n:** `WarungMengI18nProvider`, translations table
- **Order:** `OrderRepository`, `InMemoryOrderRepository` (untuk Fase 3)

### Yang PERLU dibuat storefront-local:
- Cart state (non-persistent, session-only)
- Checkout form state
- Customer order tracking view (read from OrderRepository)

---

## 7. Technical Debt yang Terekam

| ID | Area | Catatan |
|----|------|---------|
| TD-SF-001 | Persistence cart | Cart hilang saat refresh. Nanti migrasi ke localStorage/backend |
| TD-SF-002 | Auth customer | Belum ada. Checkout tanpa login |
| TD-SF-003 | Payment gateway | Placeholder saja |
| TD-SF-004 | SEO / SSR | Belum. Butuh setup lanjutan |
| TD-SF-005 | Browser QA | Perlu Playwright setelah layout stabil |

---

## 8. Aturan

1. Mobile-first: semua layout dimulai dari viewport 375px
2. Gunakan AntD Mobile komponen (List, Card, Grid, etc.)
3. Custom CSS minimal, pakai theme tokens AntD
4. Semua label bilingual ID/EN via i18n
5. Harga Rupiah pakai format Indonesia meskipun English
6. Tidak import dari `apps/admin/` atau `@warungmeng/ui-admin`
7. Tidak ubah shared business logic
8. Mock data via `InMemoryMenuCatalogRepository`
