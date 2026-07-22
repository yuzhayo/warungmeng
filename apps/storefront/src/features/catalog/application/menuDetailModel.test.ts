import { describe, expect, it } from "vitest";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import {
  clampQuantity,
  getMaxSelectableQuantity,
  isVariantOptionSelectable,
  resolveMenuBySlug,
  resolveMenuVariantGroups,
} from "./menuDetailModel";

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

function createGroup(overrides: Partial<MenuVariantGroup> = {}): MenuVariantGroup {
  return {
    id: "vg-1",
    name: "Level Pedas",
    description: "",
    visibility: "visible",
    selection: { minSelections: 1, maxSelections: 1 },
    options: [],
    sortOrder: 0,
    ...overrides,
  };
}

const cat1 = createCategory();
const catHidden = createCategory({ id: "cat-hidden", visibility: "hidden" });

describe("resolveMenuBySlug", () => {
  it("finds a visible menu in a visible category by exact slug", () => {
    const menu = createMenu();
    expect(resolveMenuBySlug([menu], [cat1], "nasi-goreng")).toBe(menu);
  });

  it("returns null for a missing slug", () => {
    expect(resolveMenuBySlug([createMenu()], [cat1], "tidak-ada")).toBeNull();
  });

  it("returns null for an empty or whitespace slug", () => {
    expect(resolveMenuBySlug([createMenu()], [cat1], "")).toBeNull();
    expect(resolveMenuBySlug([createMenu()], [cat1], "   ")).toBeNull();
  });

  it("never resolves a hidden menu", () => {
    const hidden = createMenu({ visibility: "hidden" });
    expect(resolveMenuBySlug([hidden], [cat1], "nasi-goreng")).toBeNull();
  });

  it("never resolves a menu inside a hidden category", () => {
    const menu = createMenu({ categoryId: "cat-hidden" });
    expect(resolveMenuBySlug([menu], [cat1, catHidden], "nasi-goreng")).toBeNull();
  });

  it("resolves the first match deterministically for duplicate slugs", () => {
    const first = createMenu({ id: "m1" });
    const second = createMenu({ id: "m2" });
    expect(resolveMenuBySlug([first, second], [cat1], "nasi-goreng")).toBe(first);
  });

  it("skips a hidden duplicate and resolves the visible one", () => {
    const hidden = createMenu({ id: "m1", visibility: "hidden" });
    const visible = createMenu({ id: "m2" });
    expect(resolveMenuBySlug([hidden, visible], [cat1], "nasi-goreng")).toBe(visible);
  });
});

describe("resolveMenuVariantGroups", () => {
  it("keeps only referenced groups in menu order", () => {
    const g1 = createGroup({ id: "vg-1" });
    const g2 = createGroup({ id: "vg-2" });
    const g3 = createGroup({ id: "vg-3" });
    const menu = createMenu({ variantGroupIds: ["vg-3", "vg-1"] });

    const result = resolveMenuVariantGroups(menu, [g1, g2, g3]);

    expect(result.groups.map((group) => group.id)).toEqual(["vg-3", "vg-1"]);
    expect(result.missingGroupIds).toEqual([]);
  });

  it("reports missing referenced groups", () => {
    const g1 = createGroup({ id: "vg-1" });
    const menu = createMenu({ variantGroupIds: ["vg-1", "vg-404"] });

    const result = resolveMenuVariantGroups(menu, [g1]);

    expect(result.groups.map((group) => group.id)).toEqual(["vg-1"]);
    expect(result.missingGroupIds).toEqual(["vg-404"]);
  });

  it("treats a hidden referenced group as unavailable", () => {
    const hidden = createGroup({ visibility: "hidden" });
    const menu = createMenu({ variantGroupIds: [hidden.id] });

    expect(resolveMenuVariantGroups(menu, [hidden])).toEqual({
      groups: [],
      missingGroupIds: [hidden.id],
    });
  });

  it("returns empty results for a menu without variant groups", () => {
    const result = resolveMenuVariantGroups(createMenu(), [createGroup()]);

    expect(result.groups).toEqual([]);
    expect(result.missingGroupIds).toEqual([]);
  });
});

describe("isVariantOptionSelectable", () => {
  const baseOption = {
    id: "opt-1",
    name: "Pedas",
    priceAdjustment: { amount: 0, currency: "IDR" },
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    sortOrder: 0,
  } as const;

  it("accepts an available untracked option", () => {
    expect(isVariantOptionSelectable(baseOption)).toBe(true);
  });

  it("rejects an unavailable option", () => {
    expect(
      isVariantOptionSelectable({
        ...baseOption,
        availability: { status: "unavailable", unavailableUntil: null },
      }),
    ).toBe(false);
  });

  it("rejects a tracked option with zero stock and accepts positive stock", () => {
    expect(
      isVariantOptionSelectable({ ...baseOption, inventory: { mode: "tracked", quantity: 0 } }),
    ).toBe(false);
    expect(
      isVariantOptionSelectable({ ...baseOption, inventory: { mode: "tracked", quantity: 2 } }),
    ).toBe(true);
  });
});

describe("getMaxSelectableQuantity", () => {
  it("uses tracked inventory quantity", () => {
    const menu = createMenu({ inventory: { mode: "tracked", quantity: 3 } });
    expect(getMaxSelectableQuantity(menu, 20)).toBe(3);
  });

  it("uses the untracked ceiling for untracked inventory", () => {
    expect(getMaxSelectableQuantity(createMenu(), 20)).toBe(20);
  });

  it("never returns less than 1", () => {
    const menu = createMenu({ inventory: { mode: "tracked", quantity: 0 } });
    expect(getMaxSelectableQuantity(menu, 20)).toBe(1);
  });
});

describe("clampQuantity", () => {
  it("keeps an in-range integer", () => {
    expect(clampQuantity(3, 20)).toBe(3);
  });

  it("clamps below minimum to 1", () => {
    expect(clampQuantity(0, 20)).toBe(1);
    expect(clampQuantity(-5, 20)).toBe(1);
  });

  it("clamps above the maximum", () => {
    expect(clampQuantity(25, 20)).toBe(20);
  });

  it("truncates non-integers and recovers from non-finite input", () => {
    expect(clampQuantity(2.9, 20)).toBe(2);
    expect(clampQuantity(Number.NaN, 20)).toBe(1);
  });
});
