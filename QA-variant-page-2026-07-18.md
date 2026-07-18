# QA Report: /menu/variants

**Date:** 2026-07-18  
**Viewport:** 1440×900 (desktop), 390×844 (mobile)  
**URL:** `http://localhost:3000/#/menu/variants`  
**Tool:** Playwright MCP via Claude Code  

---

## Summary

| Status | Count |
|--------|-------|
| ✅ PASS | 10 |
| ⚠️ PASS with issues | 1 |
| ❌ FAIL | 1 |
| ⏭️ SKIP | 1 |

---

## Test Results

### 1. Category rail has own scrollbar
**✅ PASS**

- Element: `aside.catalog-category-rail` (`overflow-y: auto`)
- scrollHeight (888px) = clientHeight (888px) → content fits, no scrollbar needed
- Scrollbar akan muncul otomatis jika konten melebihi 888px

---

### 2. Header category and table are amber
**✅ PASS**

- Background menggunakan `--wm-catalog-header-background` yang berasal dari `token.colorPrimary`
- Default: `#d99a27` (golden-amber / dark mustard)
- Text color: computed via `getReadableTextColor()` untuk kontras optimal

---

### 3. Click Categories header shows all variants
**✅ PASS**

| Step | Observation |
|------|-------------|
| Initial | 30 items, "Semua (30)" radio checked |
| Click "Makanan" | Filter ke 5 item |
| Click "Kategori" header | Filter cleared, kembali 30 items |

---

### 4. Click category filters list
**✅ PASS**

- Klik "MIX" → tabel filter ke 10 item (hanya MIX)
- Radio berubah ke "Semua (10)"
- Item MIX marked `[active]`

---

### 5. Pencil does NOT trigger filter
**⏭️ SKIP** — precondition unmet

UI kategori varian tidak memiliki pencil/edit icon pada item kategori. Setiap kategori hanya menampilkan `tags` icon + nama + count.

---

### 6. Collapse/expand category works
**✅ PASS**

| Action | Result |
|--------|--------|
| Initial state | Expanded — button "Tutup kategori" `[expanded]` |
| Click collapse | Button → "Buka kategori", rail mengecil |
| Click expand | Button → "Tutup kategori" `[expanded]`, rail kembali |

---

### 7. Inline edit name and price
**❌ FAIL** — agent error (429 rate limit)

Review manual diperlukan. File terkait:
- `VariantOptionListTable.tsx`

---

### 8. Availability toggle works
**✅ PASS**

| State | Toggle "BUMBU 50ml" |
|-------|---------------------|
| Initial | `checked` = Tersedia |
| After 1st click | `unchecked` = Tidak Tersedia |
| After 2nd click | `checked` = Tersedia (restored) |

---

### 9. Delete only after Popconfirm
**✅ PASS**

1. Click "Hapus varian BUMBU 50ml"
2. Popconfirm muncul: **"Hapus BUMBU 50ml?"** + "Varian ini akan dihapus dari kategori."
3. Tombol: [Batal] [Hapus]
4. Click "Batal" → item tetap ada, tidak terhapus

Implementation: `VariantOptionListTable.tsx:194-212` (Popconfirm wrapper)

---

### 10. Table vertical scroll & no overflow
**✅ PASS**

| Metric | Value |
|--------|-------|
| `.ant-table-body` overflow-y | `scroll` |
| `.ant-table-body` max-height | 832px |
| scrollHeight vs clientHeight | 1695 > 817 → scrollbar visible |
| `.ant-table-body` scroll.x | 1100 |
| Page-level horizontal overflow | **NO** — parent `overflow: hidden` |

⚠️ **Caveat:** `.ant-table-header` punya `overflow-x: hidden`. Jika user horizontal scroll body, header tidak sinkron → kolom misalignment. Fix saat responsive column widths menggantikan `scroll.x` fixed values.

---

### 11a. Desktop viewport (1440×900)
**✅ PASS**

Semua elemen tampil penuh: toolbar, category rail, table, availability filter, actions.

---

### 11b. Mobile viewport (390×844)
**⚠️ PASS with issues**

| Element | Status |
|---------|--------|
| Header | ✅ Responsive |
| Sidebar | ✅ Collapsed to 1px, opens on hamburger |
| Category rail | ✅ Visible |
| Table | ⚠️ Horizontal scroll required |
| Search + filter | ✅ Wraps to 2 rows |
| Page-level overflow | ✅ None (scrollWidth = clientWidth) |

**🐛 Bug found: z-index overlap on mobile**
- `.catalog-category-rail__header` sticky element overlaps `.ant-menu-item` items
- Viewport ≤48rem: user tap kategori terkena header, bukan menu item
- CSS z-index issue in category rail header vs menu items

---

### 12. Console & network errors
**✅ CLEAN**

| Metric | Value |
|--------|-------|
| Console errors | 0 |
| Network requests | 458 all 200 OK |
| favicon.ico 404 | Only on cold load (non-issue) |

---

## Bug Reports

### Bug #1: Mobile category z-index overlap
**File:** `CatalogSplitTableLayout.tsx` / `.catalog-category-rail` CSS
- **Severity:** Medium
- **Viewport:** ≤48rem
- **Expected:** User tap pada kategori item memicu filter
- **Actual:** Sticky header "Kategori Varian" secara visual overlap menu items, blocking tap
- **Fix:** Adjust z-index stacking between `.catalog-category-rail__header` and `.ant-menu-item`

### Bug #2: Inline edit not verified
- **Severity:** Low (unconfirmed)
- **Cause:** 429 rate limit during QA
- **Action:** Manual test required: double-click name/price cell → edit → save

---

## Files Referenced

- `apps/admin/src/features/menu/components/VariantOptionListTable.tsx` (Popconfirm, lines 194-212)
- `apps/admin/src/features/menu/components/CatalogSplitTableLayout.tsx` (CSS vars, z-index)
- `apps/admin/src/features/menu/application/useVariantGroupList.ts` (delete handler, line 134-136)
- `apps/admin/src/features/menu/views/VariantListView.test.tsx` (unit tests)
- `packages/ui-admin/src/theme/themeDefaults.ts` (`colorPrimary: "#d99a27"`, line 8)
