import type { MenuItem } from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import {
  countMenusByAvailability,
  createCategoryCounts,
  filterMenuItems,
  type MenuListFilters,
} from "./menuListModel";

function createMenu(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "menu-gado",
    name: "Gado-gado",
    slug: "gado-gado",
    categoryId: "food",
    description: "Saus kacang",
    image: null,
    price: { amount: 22_000, currency: "IDR" },
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

const menus = [
  createMenu(),
  createMenu({
    id: "menu-tea",
    name: "Es teh",
    slug: "es-teh",
    categoryId: "drink",
    description: "Teh dingin manis",
    availability: { status: "unavailable", unavailableUntil: null },
  }),
];

const defaultFilters: MenuListFilters = {
  search: "",
  categoryId: null,
  availability: "all",
};

describe("menuListModel", () => {
  it("filters by search, category, and availability without mutating input", () => {
    expect(filterMenuItems(menus, { ...defaultFilters, search: "KACANG" })).toMatchObject([
      { id: "menu-gado" },
    ]);
    expect(filterMenuItems(menus, { ...defaultFilters, categoryId: "drink" })).toMatchObject([
      { id: "menu-tea" },
    ]);
    expect(
      filterMenuItems(menus, { ...defaultFilters, availability: "unavailable" }),
    ).toMatchObject([{ id: "menu-tea" }]);
    expect(menus).toHaveLength(2);
  });

  it("builds category counts from the active search and availability filters", () => {
    const counts = createCategoryCounts(menus, {
      ...defaultFilters,
      availability: "available",
    });

    expect(counts.get("food")).toBe(1);
    expect(counts.get("drink")).toBeUndefined();
  });

  it("counts each availability option while preserving other filters", () => {
    expect(countMenusByAvailability(menus, defaultFilters, "all")).toBe(2);
    expect(countMenusByAvailability(menus, defaultFilters, "unavailable")).toBe(1);
    expect(
      countMenusByAvailability(menus, { ...defaultFilters, categoryId: "food" }, "unavailable"),
    ).toBe(0);
  });
});
