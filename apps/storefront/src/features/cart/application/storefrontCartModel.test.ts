import { describe, expect, it } from "vitest";
import type { MenuItem, OrderVariantSelection } from "@warungmeng/domain";
import {
  addStorefrontCartItem,
  calculateCartItemLineTotal,
  calculateCartItemUnitPrice,
  calculateCartSubtotal,
  calculateDraftLineTotal,
  calculateDraftUnitPrice,
  countCartItems,
  createStorefrontCartItem,
  groupCartItemSelections,
  removeStorefrontCartItem,
  replaceStorefrontCartItem,
  setStorefrontCartItemQuantity,
} from "./storefrontCartModel";

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

function createSelection(overrides: Partial<OrderVariantSelection> = {}): OrderVariantSelection {
  return {
    groupId: "vg-1",
    groupName: "Level Pedas",
    optionId: "opt-1",
    optionName: "Pedas",
    priceAdjustment: { amount: 2000, currency: "IDR" },
    ...overrides,
  };
}

let idCounter = 0;
const nextId = () => `cart-item-${++idCounter}`;

describe("createStorefrontCartItem", () => {
  it("builds an item from menu data with a factory-provided id and trimmed note", () => {
    const item = createStorefrontCartItem(
      {
        menu: createMenu(),
        variantSelections: [createSelection()],
        quantity: 2,
        note: "  tidak pedas  ",
      },
      () => "id-1",
    );

    expect(item).toEqual({
      id: "id-1",
      menuItemId: "m1",
      name: "Nasi Goreng",
      unitPrice: { amount: 25000, currency: "IDR" },
      variantSelections: [createSelection()],
      quantity: 2,
      note: "tidak pedas",
    });
  });

  it("copies price data so cart items do not share references with menu data", () => {
    const menu = createMenu();
    const selection = createSelection();
    const item = createStorefrontCartItem(
      { menu, variantSelections: [selection], quantity: 1, note: "" },
      () => "id-1",
    );

    expect(item.unitPrice).not.toBe(menu.price);
    expect(item.variantSelections[0]).not.toBe(selection);
    expect(item.variantSelections[0]?.priceAdjustment).not.toBe(selection.priceAdjustment);
  });
});

describe("addStorefrontCartItem", () => {
  it("appends a new configuration as a new line", () => {
    const first = createStorefrontCartItem(
      { menu: createMenu(), variantSelections: [], quantity: 1, note: "" },
      nextId,
    );
    const second = createStorefrontCartItem(
      {
        menu: createMenu({ id: "m2", name: "Mie Ayam" }),
        variantSelections: [],
        quantity: 1,
        note: "",
      },
      nextId,
    );

    const items = addStorefrontCartItem(addStorefrontCartItem([], first), second);

    expect(items).toHaveLength(2);
  });

  it("merges identical menu, variants, and trimmed note by summing quantity", () => {
    const base = {
      menu: createMenu(),
      variantSelections: [createSelection()],
      quantity: 1,
      note: "tidak pedas",
    };
    const first = createStorefrontCartItem(base, nextId);
    const second = createStorefrontCartItem(
      { ...base, quantity: 2, note: " tidak pedas " },
      nextId,
    );

    const items = addStorefrontCartItem(addStorefrontCartItem([], first), second);

    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(3);
    expect(items[0]?.id).toBe(first.id);
  });

  it("keeps a different note as a separate line", () => {
    const base = { menu: createMenu(), variantSelections: [], quantity: 1, note: "" };
    const first = createStorefrontCartItem(base, nextId);
    const second = createStorefrontCartItem({ ...base, note: "pedas" }, nextId);

    const items = addStorefrontCartItem(addStorefrontCartItem([], first), second);

    expect(items).toHaveLength(2);
  });

  it("keeps different variant selections as separate lines", () => {
    const base = { menu: createMenu(), quantity: 1, note: "" };
    const first = createStorefrontCartItem(
      { ...base, variantSelections: [createSelection({ optionId: "opt-1" })] },
      nextId,
    );
    const second = createStorefrontCartItem(
      { ...base, variantSelections: [createSelection({ optionId: "opt-2" })] },
      nextId,
    );

    const items = addStorefrontCartItem(addStorefrontCartItem([], first), second);

    expect(items).toHaveLength(2);
  });
});

describe("setStorefrontCartItemQuantity", () => {
  const items = [
    createStorefrontCartItem(
      { menu: createMenu(), variantSelections: [], quantity: 2, note: "" },
      () => "line-1",
    ),
  ];

  it("updates the quantity of the targeted line", () => {
    const next = setStorefrontCartItemQuantity(items, "line-1", 5);

    expect(next).toHaveLength(1);
    expect(next[0]?.quantity).toBe(5);
  });

  it("removes the line when quantity drops to zero", () => {
    expect(setStorefrontCartItemQuantity(items, "line-1", 0)).toHaveLength(0);
  });
});

describe("removeStorefrontCartItem", () => {
  it("removes only the targeted line", () => {
    const first = createStorefrontCartItem(
      { menu: createMenu(), variantSelections: [], quantity: 1, note: "" },
      () => "line-1",
    );
    const second = createStorefrontCartItem(
      { menu: createMenu({ id: "m2" }), variantSelections: [], quantity: 1, note: "" },
      () => "line-2",
    );

    const next = removeStorefrontCartItem([first, second], "line-1");

    expect(next.map((item) => item.id)).toEqual(["line-2"]);
  });
});

describe("replaceStorefrontCartItem", () => {
  it("swaps an edited line for its replacement configuration", () => {
    const original = createStorefrontCartItem(
      { menu: createMenu(), variantSelections: [], quantity: 1, note: "" },
      () => "line-1",
    );
    const edited = createStorefrontCartItem(
      { menu: createMenu(), variantSelections: [createSelection()], quantity: 3, note: "pedas" },
      () => "line-2",
    );

    const next = replaceStorefrontCartItem([original], "line-1", edited);

    expect(next).toHaveLength(1);
    expect(next[0]?.id).toBe("line-2");
    expect(next[0]?.quantity).toBe(3);
    expect(next[0]?.note).toBe("pedas");
  });

  it("merges into an existing line when the edit matches its configuration", () => {
    const base = { menu: createMenu(), variantSelections: [], quantity: 1, note: "" };
    const kept = createStorefrontCartItem(base, () => "line-1");
    const edited = createStorefrontCartItem(
      { menu: createMenu(), variantSelections: [createSelection()], quantity: 2, note: "" },
      () => "line-2",
    );
    const replacement = createStorefrontCartItem({ ...base, quantity: 2 }, () => "line-3");

    const next = replaceStorefrontCartItem([kept, edited], "line-2", replacement);

    expect(next).toHaveLength(1);
    expect(next[0]?.id).toBe("line-1");
    expect(next[0]?.quantity).toBe(3);
  });
});

describe("groupCartItemSelections", () => {
  it("groups selected option ids by variant group for configurator prefill", () => {
    const item = createStorefrontCartItem(
      {
        menu: createMenu(),
        variantSelections: [
          createSelection({ groupId: "vg-2", optionId: "opt-9" }),
          createSelection({ optionId: "opt-1" }),
          createSelection({ optionId: "opt-2" }),
        ],
        quantity: 1,
        note: "",
      },
      () => "line-1",
    );

    expect(groupCartItemSelections(item)).toEqual({
      "vg-1": ["opt-1", "opt-2"],
      "vg-2": ["opt-9"],
    });
  });

  it("returns an empty record for a line without variants", () => {
    const item = createStorefrontCartItem(
      { menu: createMenu(), variantSelections: [], quantity: 1, note: "" },
      () => "line-1",
    );

    expect(groupCartItemSelections(item)).toEqual({});
  });
});

describe("cart totals", () => {
  it("sums quantities and line totals across the cart", () => {
    const first = createStorefrontCartItem(
      { menu: createMenu(), variantSelections: [createSelection()], quantity: 2, note: "" },
      () => "line-1",
    );
    const second = createStorefrontCartItem(
      {
        menu: createMenu({ id: "m2", price: { amount: 10000, currency: "IDR" } }),
        variantSelections: [],
        quantity: 3,
        note: "",
      },
      () => "line-2",
    );

    expect(countCartItems([first, second])).toBe(5);
    expect(calculateCartSubtotal([first, second])).toBe(2 * 27000 + 3 * 10000);
    expect(countCartItems([])).toBe(0);
    expect(calculateCartSubtotal([])).toBe(0);
  });
});

describe("price adapters", () => {
  const menu = createMenu();
  const selections = [
    createSelection({ optionId: "opt-1", priceAdjustment: { amount: 2000, currency: "IDR" } }),
    createSelection({
      groupId: "vg-2",
      optionId: "opt-9",
      priceAdjustment: { amount: 3000, currency: "IDR" },
    }),
  ];

  it("calculates a draft unit price from base price plus adjustments", () => {
    expect(calculateDraftUnitPrice(menu, [])).toBe(25000);
    expect(calculateDraftUnitPrice(menu, selections)).toBe(30000);
  });

  it("multiplies the draft line total by quantity", () => {
    expect(calculateDraftLineTotal(menu, selections, 3)).toBe(90000);
  });

  it("matches the shared helpers for stored cart items", () => {
    const item = createStorefrontCartItem(
      { menu, variantSelections: selections, quantity: 3, note: "" },
      () => "id-1",
    );

    expect(calculateCartItemUnitPrice(item)).toBe(30000);
    expect(calculateCartItemLineTotal(item)).toBe(90000);
  });
});
