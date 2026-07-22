import { describe, expect, it } from "vitest";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import type { StorefrontCartItem } from "./storefrontCartModel";
import { validateCartItems } from "./cartValidation";

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
    options: [
      {
        id: "opt-1",
        name: "Pedas",
        priceAdjustment: { amount: 2000, currency: "IDR" },
        availability: { status: "available" },
        inventory: { mode: "untracked" },
        sortOrder: 0,
      },
    ],
    sortOrder: 0,
    ...overrides,
  };
}

function createLine(overrides: Partial<StorefrontCartItem> = {}): StorefrontCartItem {
  return {
    id: "line-1",
    menuItemId: "m1",
    name: "Nasi Goreng",
    unitPrice: { amount: 25000, currency: "IDR" },
    variantSelections: [],
    quantity: 1,
    note: "",
    ...overrides,
  };
}

const snapshot = {
  menus: [createMenu()],
  categories: [createCategory()],
  variantGroups: [] as readonly MenuVariantGroup[],
};

describe("validateCartItems", () => {
  it("accepts a line matching the current catalog", () => {
    const result = validateCartItems([createLine()], snapshot);

    expect(result.allValid).toBe(true);
    expect(result.lines[0]?.issues).toEqual([]);
    expect(result.lines[0]?.menu?.id).toBe("m1");
  });

  it("marks a line whose menu disappeared or became hidden", () => {
    const missing = validateCartItems([createLine({ menuItemId: "gone" })], snapshot);
    expect(missing.lines[0]?.issues).toEqual(["menu-missing"]);

    const hidden = validateCartItems([createLine()], {
      ...snapshot,
      menus: [createMenu({ visibility: "hidden" })],
    });
    expect(hidden.lines[0]?.issues).toEqual(["menu-missing"]);

    const hiddenCategory = validateCartItems([createLine()], {
      ...snapshot,
      categories: [createCategory({ visibility: "hidden" })],
    });
    expect(hiddenCategory.lines[0]?.issues).toEqual(["menu-missing"]);
    expect(hiddenCategory.allValid).toBe(false);
  });

  it("marks an unavailable menu", () => {
    const result = validateCartItems([createLine()], {
      ...snapshot,
      menus: [createMenu({ availability: { status: "unavailable", unavailableUntil: null } })],
    });

    expect(result.lines[0]?.issues).toEqual(["menu-unavailable"]);
  });

  it("marks selections that no longer satisfy the current rule", () => {
    // Menu now requires exactly one selection from vg-1 but the line has none.
    const result = validateCartItems([createLine()], {
      ...snapshot,
      menus: [createMenu({ variantGroupIds: ["vg-1"] })],
      variantGroups: [createGroup()],
    });

    expect(result.lines[0]?.issues).toEqual(["variant-invalid"]);
  });

  it("marks a line invalid when its referenced variant group becomes hidden", () => {
    const result = validateCartItems([createLine()], {
      ...snapshot,
      menus: [createMenu({ variantGroupIds: ["vg-1"] })],
      variantGroups: [createGroup({ visibility: "hidden" })],
    });

    expect(result.lines[0]?.issues).toEqual(["variant-invalid"]);
    expect(result.allValid).toBe(false);
  });

  it("marks selections pointing at removed groups or options", () => {
    const line = createLine({
      variantSelections: [
        {
          groupId: "vg-gone",
          groupName: "Lama",
          optionId: "opt-x",
          optionName: "Hilang",
          priceAdjustment: { amount: 0, currency: "IDR" },
        },
      ],
    });

    const result = validateCartItems([line], snapshot);

    expect(result.lines[0]?.issues).toEqual(["variant-invalid"]);
  });

  it("marks an unavailable selected option", () => {
    const line = createLine({
      variantSelections: [
        {
          groupId: "vg-1",
          groupName: "Level Pedas",
          optionId: "opt-1",
          optionName: "Pedas",
          priceAdjustment: { amount: 2000, currency: "IDR" },
        },
      ],
      unitPrice: { amount: 25000, currency: "IDR" },
    });
    const unavailableOptionGroup = createGroup({
      options: [
        {
          id: "opt-1",
          name: "Pedas",
          priceAdjustment: { amount: 2000, currency: "IDR" },
          availability: { status: "unavailable", unavailableUntil: null },
          inventory: { mode: "untracked" },
          sortOrder: 0,
        },
      ],
    });

    const result = validateCartItems([line], {
      ...snapshot,
      menus: [createMenu({ variantGroupIds: ["vg-1"] })],
      variantGroups: [unavailableOptionGroup],
    });

    expect(result.lines[0]?.issues).toEqual(["variant-invalid"]);
  });

  it("marks a price change without silently repricing the line", () => {
    const result = validateCartItems([createLine()], {
      ...snapshot,
      menus: [createMenu({ price: { amount: 30000, currency: "IDR" } })],
    });

    expect(result.lines[0]?.issues).toEqual(["price-changed"]);
    expect(result.lines[0]?.item.unitPrice.amount).toBe(25000);
  });

  it("marks tracked stock shortages", () => {
    const result = validateCartItems([createLine({ quantity: 5 })], {
      ...snapshot,
      menus: [createMenu({ inventory: { mode: "tracked", quantity: 3 } })],
    });

    expect(result.lines[0]?.issues).toEqual(["stock-shortage"]);
  });

  it("collects multiple issues on one line", () => {
    const result = validateCartItems([createLine({ quantity: 5 })], {
      ...snapshot,
      menus: [
        createMenu({
          availability: { status: "unavailable", unavailableUntil: null },
          inventory: { mode: "tracked", quantity: 2 },
          price: { amount: 26000, currency: "IDR" },
        }),
      ],
    });

    expect(result.lines[0]?.issues).toEqual([
      "menu-unavailable",
      "price-changed",
      "stock-shortage",
    ]);
    expect(result.allValid).toBe(false);
  });
});
