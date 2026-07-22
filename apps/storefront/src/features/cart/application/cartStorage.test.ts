import { describe, expect, it, vi } from "vitest";
import type { StorefrontCartItem } from "./storefrontCartModel";
import {
  CART_STORAGE_KEY,
  clearStoredCart,
  loadStoredCartItems,
  saveStoredCartItems,
  type CartStorageLike,
} from "./cartStorage";

function createItem(overrides: Partial<StorefrontCartItem> = {}): StorefrontCartItem {
  return {
    id: "line-1",
    menuItemId: "m1",
    name: "Nasi Goreng",
    unitPrice: { amount: 25000, currency: "IDR" },
    variantSelections: [
      {
        groupId: "vg-1",
        groupName: "Level Pedas",
        optionId: "opt-1",
        optionName: "Pedas",
        priceAdjustment: { amount: 2000, currency: "IDR" },
      },
    ],
    quantity: 2,
    note: "tanpa bawang",
    ...overrides,
  };
}

function createMemoryStorage(initial: Record<string, string> = {}): CartStorageLike & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe("cartStorage", () => {
  it("round-trips cart items through the versioned key", () => {
    const storage = createMemoryStorage();
    const items = [createItem(), createItem({ id: "line-2", note: "" })];

    saveStoredCartItems(storage, items);

    expect(storage.data.has(CART_STORAGE_KEY)).toBe(true);
    expect(loadStoredCartItems(storage)).toEqual(items);
  });

  it("discards a snapshot with a different version", () => {
    const storage = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({ version: 99, items: [createItem()] }),
    });

    expect(loadStoredCartItems(storage)).toEqual([]);
  });

  it("discards malformed JSON safely", () => {
    const storage = createMemoryStorage({ [CART_STORAGE_KEY]: "{not json" });

    expect(loadStoredCartItems(storage)).toEqual([]);
  });

  it("drops structurally invalid lines while keeping valid ones", () => {
    const valid = createItem();
    const storage = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({
        version: 1,
        items: [
          valid,
          { id: "broken", quantity: -3 },
          { ...createItem({ id: "line-3" }), unitPrice: { amount: "abc", currency: "IDR" } },
          "not-an-object",
        ],
      }),
    });

    expect(loadStoredCartItems(storage)).toEqual([valid]);
  });

  it("returns an empty cart when storage is unavailable or throwing", () => {
    expect(loadStoredCartItems(null)).toEqual([]);

    const throwing: CartStorageLike = {
      getItem: vi.fn(() => {
        throw new Error("denied");
      }),
      setItem: vi.fn(() => {
        throw new Error("denied");
      }),
      removeItem: vi.fn(() => {
        throw new Error("denied");
      }),
    };

    expect(loadStoredCartItems(throwing)).toEqual([]);
    expect(() => saveStoredCartItems(throwing, [createItem()])).not.toThrow();
    expect(() => clearStoredCart(throwing)).not.toThrow();
  });

  it("clears the snapshot", () => {
    const storage = createMemoryStorage();
    saveStoredCartItems(storage, [createItem()]);

    clearStoredCart(storage);

    expect(storage.data.has(CART_STORAGE_KEY)).toBe(false);
    expect(loadStoredCartItems(storage)).toEqual([]);
  });
});
