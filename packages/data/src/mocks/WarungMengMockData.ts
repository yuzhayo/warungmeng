import type {
  MenuCategory,
  MenuItem,
  MenuVariantGroup,
  VariantSelectionRule,
} from "@warungmeng/domain";
import rawVariantRows from "../../../../Kategori Varian.json";
import rawMenuRows from "../../../../Menu Utama.json";
import {
  InMemoryMenuCatalogRepository,
  type InMemoryMenuCatalogSeed,
} from "./InMemoryMenuCatalogRepository";

interface RawMenuRow {
  readonly "Kategori ID": string;
  readonly "Nama Kategori": string;
  readonly "Menu ID": string;
  readonly "Nama Menu": string;
  readonly "Harga (Rp)": string;
  readonly "Status Tampilan": string;
  readonly "Ketersediaan Stok": string;
  readonly Stok: string;
  readonly "Stok Tersisa": string;
  readonly Deskripsi: string;
  readonly "Tipe Waktu Penjualan": string;
  readonly "Kategori Varian": string;
  readonly "Foto Menu": string;
}

interface RawVariantRow {
  readonly "ID Kategori Varian": string;
  readonly "Nama Kategori Varian": string;
  readonly "Status Tampilan": string;
  readonly Catatan: string;
  readonly "Opsi ID": string;
  readonly "Nama Opsi": string;
  readonly "Harga Opsi (Rp)": string;
  readonly "Opsi Tersedia": string;
  readonly "Kontrol Pemilihan Kategori Varian": string;
  readonly X: string;
  readonly Y: string;
}

function unwrapSpreadsheetValue(value: string): string {
  const trimmed = value.trim();
  const wrapped = /^="(.*)"$/.exec(trimmed);
  return (wrapped?.[1] ?? trimmed).trim();
}

function parseNonNegativeInteger(value: string): number {
  const parsed = Number.parseInt(unwrapSpreadsheetValue(value), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toVisibility(value: string): "visible" | "hidden" {
  return value === "Tampilkan" ? "visible" : "hidden";
}

function toAvailability(value: string): MenuItem["availability"] {
  return value === "Tersedia"
    ? { status: "available" }
    : { status: "unavailable", unavailableUntil: null };
}

function toSelectionRule(row: RawVariantRow): VariantSelectionRule {
  const control = row["Kontrol Pemilihan Kategori Varian"];
  const x = parseNonNegativeInteger(row.X);
  const y = parseNonNegativeInteger(row.Y);

  if (control === "Pilih_X_") {
    return { minSelections: x, maxSelections: x };
  }
  if (control === "Pilih min._X_") {
    return { minSelections: x, maxSelections: null };
  }
  if (control === "Opsional, Maks. _Y_") {
    return { minSelections: 0, maxSelections: y };
  }
  return { minSelections: 0, maxSelections: null };
}

function createCategories(rows: readonly RawMenuRow[]): MenuCategory[] {
  const categories = new Map<string, MenuCategory>();

  rows.forEach((row) => {
    const id = unwrapSpreadsheetValue(row["Kategori ID"]);
    if (categories.has(id)) return;

    categories.set(id, {
      id,
      name: row["Nama Kategori"].trim(),
      slug: slugify(row["Nama Kategori"]),
      visibility: "visible",
      sortOrder: categories.size,
    });
  });

  return [...categories.values()];
}

function createMenus(rows: readonly RawMenuRow[]): MenuItem[] {
  const usedSlugs = new Set<string>();

  return rows.map((row, sortOrder) => {
    const id = unwrapSpreadsheetValue(row["Menu ID"]);
    const baseSlug = slugify(row["Nama Menu"]);
    const slug = usedSlugs.has(baseSlug) ? `${baseSlug}-${id.slice(-6)}` : baseSlug;
    usedSlugs.add(slug);

    return {
      id,
      name: row["Nama Menu"].trim(),
      slug,
      categoryId: unwrapSpreadsheetValue(row["Kategori ID"]),
      description: row.Deskripsi.trim(),
      image: row["Foto Menu"].trim()
        ? {
            url: row["Foto Menu"].trim(),
            alt: row["Nama Menu"].trim(),
          }
        : null,
      price: {
        amount: parseNonNegativeInteger(row["Harga (Rp)"]),
        currency: "IDR",
      },
      compareAtPrice: null,
      availability: toAvailability(row["Ketersediaan Stok"]),
      inventory:
        row.Stok === "Terbatas"
          ? {
              mode: "tracked",
              quantity: parseNonNegativeInteger(row["Stok Tersisa"]),
            }
          : { mode: "untracked" },
      visibility: toVisibility(row["Status Tampilan"]),
      salesSchedule:
        row["Tipe Waktu Penjualan"] === "Sepanjang Hari"
          ? { mode: "always" }
          : {
              mode: "scheduled",
              activeDays: [],
              allDay: false,
              intervals: [],
            },
      variantGroupIds: unwrapSpreadsheetValue(row["Kategori Varian"])
        .split("#")
        .map((idValue) => unwrapSpreadsheetValue(idValue))
        .filter(Boolean),
      sortOrder,
    };
  });
}

function createVariantGroups(rows: readonly RawVariantRow[]): MenuVariantGroup[] {
  const groupedRows = new Map<string, RawVariantRow[]>();

  rows.forEach((row) => {
    const id = unwrapSpreadsheetValue(row["ID Kategori Varian"]);
    const existingRows = groupedRows.get(id) ?? [];
    existingRows.push(row);
    groupedRows.set(id, existingRows);
  });

  return [...groupedRows.entries()].map(([id, rowsForGroup], sortOrder) => {
    const firstRow = rowsForGroup[0];
    if (!firstRow) throw new Error(`Variant group ${id} has no options`);

    return {
      id,
      name: firstRow["Nama Kategori Varian"].trim(),
      description: firstRow.Catatan.trim(),
      visibility: toVisibility(firstRow["Status Tampilan"]),
      selection: toSelectionRule(firstRow),
      options: rowsForGroup.map((row, optionSortOrder) => ({
        id: unwrapSpreadsheetValue(row["Opsi ID"]),
        name: row["Nama Opsi"].trim(),
        priceAdjustment: {
          amount: parseNonNegativeInteger(row["Harga Opsi (Rp)"]),
          currency: "IDR",
        },
        availability: toAvailability(row["Opsi Tersedia"]),
        inventory: { mode: "untracked" },
        sortOrder: optionSortOrder,
      })),
      sortOrder,
    };
  });
}

export function createWarungMengMockSeed(): InMemoryMenuCatalogSeed {
  const menuRows = rawMenuRows as readonly RawMenuRow[];
  const variantRows = rawVariantRows as readonly RawVariantRow[];

  return {
    categories: createCategories(menuRows),
    menus: createMenus(menuRows),
    variantGroups: createVariantGroups(variantRows),
  };
}

export function createWarungMengMockRepository(): InMemoryMenuCatalogRepository {
  return new InMemoryMenuCatalogRepository(createWarungMengMockSeed());
}
