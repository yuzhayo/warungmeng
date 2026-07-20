import { describe, expect, it } from "vitest";
import type { MenuCategory, MenuItem } from "@warungmeng/domain";
import {
  buildCatalogViewModel,
  filterMenusByCategory,
  getFeaturedMenus,
  isMenuAvailableForDisplay,
  searchCatalogMenus,
} from "./storefrontCatalogModel";

function createMenu(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "m1",
    name: "Nasi Goreng",
    slug: "nasi-goreng",
    categoryId: "cat-1",
    description: "Nasi goreng spesial",
    image: null,
    price: { amount: 25000, currency: "IDR" },
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds: [],
    sortOrder: 0,
    ...overrides,
  };
}

function createCategory(overrides: Partial<MenuCategory> = {}): MenuCategory {
  return {
    id: "cat-1",
    name: "Makanan",
    slug: "makanan",
    visibility: "visible",
    sortOrder: 0,
    ...overrides,
  };
}

const cat1 = createCategory({ id: "cat-1", name: "Makanan", sortOrder: 0 });
const cat2 = createCategory({ id: "cat-2", name: "Minuman", sortOrder: 1 });
const catHidden = createCategory({
  id: "cat-hidden",
  name: "Rahasia",
  visibility: "hidden",
  sortOrder: 2,
});
const catEmpty = createCategory({ id: "cat-empty", name: "Kosong", sortOrder: 3 });

const m1 = createMenu({ id: "m1", name: "Nasi Goreng", categoryId: "cat-1", sortOrder: 0 });
const m2 = createMenu({
  id: "m2",
  name: "Mie Ayam",
  categoryId: "cat-1",
  sortOrder: 1,
  description: "Mie dengan ayam",
});
const m3 = createMenu({ id: "m3", name: "Es Teh", categoryId: "cat-2", sortOrder: 2 });
const m4 = createMenu({ id: "m4", name: "Es Jeruk", categoryId: "cat-2", sortOrder: 3 });
const m5 = createMenu({
  id: "m5",
  name: "Hidden Menu",
  categoryId: "cat-1",
  visibility: "hidden",
  sortOrder: 4,
});
const m6 = createMenu({
  id: "m6",
  name: "Unavailable Item",
  categoryId: "cat-1",
  sortOrder: 5,
  availability: { status: "unavailable", unavailableUntil: null },
});
const mHiddenCategory = createMenu({
  id: "m-hidden-category",
  name: "Hidden Category Menu",
  categoryId: "cat-hidden",
});

describe("storefrontCatalogModel", () => {
  describe("buildCatalogViewModel", () => {
    it("removes hidden menus and hidden categories", () => {
      const result = buildCatalogViewModel(
        [m1, m2, m3, m5, mHiddenCategory],
        [cat1, cat2, catHidden],
      );

      expect(result.menus).toHaveLength(3);
      expect(result.menus.find((m) => m.id === "m5")).toBeUndefined();
      expect(result.menus.find((m) => m.id === "m-hidden-category")).toBeUndefined();
      expect(result.categories.find((category) => category.id === "cat-hidden")).toBeUndefined();
    });

    it("removes categories with no visible menus", () => {
      const result = buildCatalogViewModel([m1, m2], [cat1, catEmpty]);

      expect(result.categories).toHaveLength(1);
      expect(result.categories.map((category) => category.id)).toEqual(["cat-1"]);
    });

    it("preserves repository ordering", () => {
      const result = buildCatalogViewModel([m3, m1, m2], [cat2, cat1]);

      expect(result.menus.map((m) => m.id)).toEqual(["m3", "m1", "m2"]);
    });

    it("never mutates source arrays", () => {
      const menus = [m1, m2];
      const categories = [cat1];
      const originalMenuLen = menus.length;
      const originalCatLen = categories.length;

      const result = buildCatalogViewModel(menus, categories);

      expect(menus).toHaveLength(originalMenuLen);
      expect(categories).toHaveLength(originalCatLen);
      expect(result.menus).not.toBe(menus);
      expect(result.categories).not.toBe(categories);
    });

    it("keeps business strings unchanged", () => {
      const result = buildCatalogViewModel([m1], [cat1]);

      expect(result.menus.map(({ name, description }) => ({ name, description }))).toEqual([
        { name: "Nasi Goreng", description: "Nasi goreng spesial" },
      ]);
      expect(result.categories.map((category) => category.name)).toEqual(["Makanan"]);
    });
  });

  describe("getFeaturedMenus", () => {
    it("returns at most 4 visible and available menus", () => {
      const menus = [m1, m2, m3, m4, m6];
      const result = buildCatalogViewModel(menus, [cat1, cat2]);

      const featured = getFeaturedMenus(result);

      expect(featured).toHaveLength(4);
      expect(featured.find((m) => m.id === "m6")).toBeUndefined();
    });

    it("returns fewer items when not enough available menus", () => {
      const menus = [m6];
      const result = buildCatalogViewModel(menus, [cat1]);

      const featured = getFeaturedMenus(result);

      expect(featured).toHaveLength(0);
    });

    it("preserves repository order", () => {
      const menus = [m3, m1, m2];
      const result = buildCatalogViewModel(menus, [cat1, cat2]);

      const featured = getFeaturedMenus(result);

      expect(featured.map((m) => m.id)).toEqual(["m3", "m1", "m2"]);
    });
  });

  describe("filterMenusByCategory", () => {
    it("returns only menus matching categoryId", () => {
      const viewModel = buildCatalogViewModel([m1, m2, m3, m4], [cat1, cat2]);

      const result = filterMenusByCategory(viewModel, "cat-1");

      expect(result).toHaveLength(2);
      expect(result.every((m) => m.categoryId === "cat-1")).toBe(true);
    });

    it("returns empty array when no menus match", () => {
      const viewModel = buildCatalogViewModel([m1], [cat1]);

      const result = filterMenusByCategory(viewModel, "cat-999");

      expect(result).toHaveLength(0);
    });
  });

  describe("searchCatalogMenus", () => {
    it("filters by name case-insensitively", () => {
      const viewModel = buildCatalogViewModel([m1, m2, m3], [cat1, cat2]);

      const result = searchCatalogMenus(viewModel, "mie");

      expect(result).toHaveLength(1);
      expect(result.map((menu) => menu.id)).toEqual(["m2"]);
    });

    it("filters by description", () => {
      const viewModel = buildCatalogViewModel([m1, m2], [cat1]);

      const result = searchCatalogMenus(viewModel, "ayam");

      expect(result).toHaveLength(1);
      expect(result.map((menu) => menu.id)).toEqual(["m2"]);
    });

    it("trims whitespace from query", () => {
      const viewModel = buildCatalogViewModel([m1, m2], [cat1]);

      const result = searchCatalogMenus(viewModel, "  nasi  ");

      expect(result).toHaveLength(1);
    });

    it("returns all menus for empty query", () => {
      const viewModel = buildCatalogViewModel([m1, m2, m3], [cat1, cat2]);

      const result = searchCatalogMenus(viewModel, "");

      expect(result).toHaveLength(3);
    });

    it("returns all menus for whitespace-only query", () => {
      const viewModel = buildCatalogViewModel([m1, m2], [cat1]);

      const result = searchCatalogMenus(viewModel, "   ");

      expect(result).toHaveLength(2);
    });

    it("returns empty array for non-matching query", () => {
      const viewModel = buildCatalogViewModel([m1, m2], [cat1]);

      const result = searchCatalogMenus(viewModel, "zzzzz");

      expect(result).toHaveLength(0);
    });
  });

  describe("isMenuAvailableForDisplay", () => {
    it("returns true for available menu", () => {
      expect(isMenuAvailableForDisplay(m1)).toBe(true);
    });

    it("returns false for unavailable menu", () => {
      expect(isMenuAvailableForDisplay(m6)).toBe(false);
    });
  });
});
