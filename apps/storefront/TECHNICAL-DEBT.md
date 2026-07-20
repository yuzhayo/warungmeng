# Technical Debt — Storefront

| ID | Area | Status | Blocking | Exit Criteria |
|----|------|--------|----------|---------------|
| TD-SF-001 | Cart persistence | Open | Tidak untuk fase 1-3 | Cart survive refresh via localStorage atau backend |
| TD-SF-002 | Auth customer | Open | Tidak untuk checkout mock | Login/skip flow tersedia |
| TD-SF-003 | Payment gateway | Open | Tidak untuk mock | Payment flow end-to-end dengan provider |
| TD-SF-004 | SEO / SSR | Open | Tidak untuk prototype | Meta tags, SSR atau prerender |
| TD-SF-005 | Browser QA | Open | Tidak untuk mock-first | Playwright evidence critical flow |

## TD-SF-001 — Cart Persistence

Cart saat ini in-memory, hilang saat refresh.

**Future:**
- Simpan ke localStorage untuk survival refresh
- Sync ke backend ketika auth tersedia
- Conflict resolution jika cart sudah stale

## TD-SF-002 — Customer Auth

Belum ada login. Checkout tanpa identitas customer.

**Future:**
- Login opsional (skip sebagai guest)
- Integration dengan auth (ditunda di roadmap admin)
- Riwayat pesanan per customer

## TD-SF-003 — Payment Gateway

Metode pembayaran masih placeholder.

**Future:**
- Payment intent + callback
- Midtrans / QRIS / cash on delivery
- Reconciliation

## TD-SF-004 — SEO

Storefront perlu SEO untuk discovery.

**Future:**
- Meta tags per halaman
- SSR (Next.js atau Vite SSR)
- Sitemap untuk menu/outlet

## TD-SF-005 — Browser QA

Belum ada screenshot/playwright.

**Future:**
- Desktop + mobile critical flow
- Console error check
- Responsive layout verification
