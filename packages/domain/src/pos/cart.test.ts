import { describe, expect, it } from "vitest";
import type { MenuItem, MenuVariantGroup } from "../catalog/types";
import {
  addPosCartItem,
  isMenuSellable,
  removePosCartItem,
  resolvePosVariantSelections,
  setPosCartItemQuantity,
} from "./cart";
import type { PosCartItem } from "./types";

const menu: MenuItem = {
  id: "menu-1",
  name: "GADO-GADO",
  slug: "gado-gado",
  categoryId: "food",
  description: "",
  image: null,
  price: { amount: 22_000, currency: "IDR" },
  compareAtPrice: null,
  availability: { status: "available" },
  inventory: { mode: "untracked" },
  visibility: "visible",
  salesSchedule: { mode: "always" },
  variantGroupIds: ["portion"],
  sortOrder: 0,
};

const group: MenuVariantGroup = {
  id: "portion",
  name: "Porsi",
  description: "",
  visibility: "visible",
  selection: { minSelections: 1, maxSelections: 1 },
  options: [
    {
      id: "regular",
      name: "Reguler",
      priceAdjustment: { amount: 0, currency: "IDR" },
      availability: { status: "available" },
      inventory: { mode: "untracked" },
      sortOrder: 0,
    },
    {
      id: "large",
      name: "Besar",
      priceAdjustment: { amount: 4_000, currency: "IDR" },
      availability: { status: "available" },
      inventory: { mode: "untracked" },
      sortOrder: 1,
    },
  ],
  sortOrder: 0,
};

function cartItem(id = "cart-1"): PosCartItem {
  return {
    id,
    menuItemId: menu.id,
    name: menu.name,
    unitPrice: menu.price,
    variantSelections: [],
    quantity: 1,
    note: "",
  };
}

describe("POS cart", () => {
  it("recognizes sellable menu state", () => {
    expect(isMenuSellable(menu)).toBe(true);
    expect(isMenuSellable({ ...menu, visibility: "hidden" })).toBe(false);
    expect(isMenuSellable({ ...menu, inventory: { mode: "tracked", quantity: 0 } })).toBe(false);
  });

  it("validates and resolves required variant selections", () => {
    expect(resolvePosVariantSelections(menu, [group], {}).valid).toBe(false);
    expect(resolvePosVariantSelections(menu, [group], { portion: ["large"] })).toMatchObject({
      valid: true,
      selections: [{ optionId: "large", optionName: "Besar" }],
    });
  });

  it("merges identical configurations and keeps different notes separate", () => {
    expect(addPosCartItem([cartItem()], cartItem("cart-2"))).toMatchObject([{ quantity: 2 }]);
    expect(addPosCartItem([cartItem()], { ...cartItem("cart-2"), note: "Pedas" })).toHaveLength(2);
  });

  it("updates quantity and removes cart items immutably", () => {
    const original = [cartItem()];
    expect(setPosCartItemQuantity(original, "cart-1", 3)).toMatchObject([{ quantity: 3 }]);
    expect(setPosCartItemQuantity(original, "cart-1", 0)).toEqual([]);
    expect(removePosCartItem(original, "cart-1")).toEqual([]);
    expect(original[0]?.quantity).toBe(1);
  });
});
