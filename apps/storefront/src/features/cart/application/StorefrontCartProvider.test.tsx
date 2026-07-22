import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import type { MenuItem, OrderVariantSelection } from "@warungmeng/domain";
import { CART_STORAGE_KEY, type CartStorageLike } from "./cartStorage";
import { StorefrontCartProvider } from "./StorefrontCartProvider";
import { useStorefrontCart } from "./storefrontCartContext";
import type { StorefrontCartItem } from "./storefrontCartModel";

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

function createStoredItem(overrides: Partial<StorefrontCartItem> = {}): StorefrontCartItem {
  return {
    id: "stored-1",
    menuItemId: "m1",
    name: "Nasi Goreng",
    unitPrice: { amount: 25000, currency: "IDR" },
    variantSelections: [],
    quantity: 2,
    note: "",
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

function readSnapshotItems(storage: { data: Map<string, string> }): StorefrontCartItem[] {
  const raw = storage.data.get(CART_STORAGE_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as { items: StorefrontCartItem[] }).items;
}

function renderCart(storage: CartStorageLike | null) {
  let counter = 0;
  const wrapper = ({ children }: PropsWithChildren) => (
    <StorefrontCartProvider storage={storage} createItemId={() => `line-${++counter}`}>
      {children}
    </StorefrontCartProvider>
  );
  return renderHook(() => useStorefrontCart(), { wrapper });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StorefrontCartProvider", () => {
  it("hydrates from storage before the first render so counts never flicker", () => {
    const stored = createStoredItem();
    const storage = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({ version: 1, items: [stored] }),
    });

    const { result } = renderCart(storage);

    expect(result.current.items).toEqual([stored]);
  });

  it("persists a snapshot after adding an item", () => {
    const storage = createMemoryStorage();
    const { result } = renderCart(storage);

    act(() => {
      result.current.addItem({
        menu: createMenu(),
        variantSelections: [createSelection()],
        quantity: 2,
        note: " tanpa bawang ",
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(readSnapshotItems(storage)).toEqual([
      {
        id: "line-1",
        menuItemId: "m1",
        name: "Nasi Goreng",
        unitPrice: { amount: 25000, currency: "IDR" },
        variantSelections: [createSelection()],
        quantity: 2,
        note: "tanpa bawang",
      },
    ]);
  });

  it("updates quantity and persists the change", () => {
    const storage = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({ version: 1, items: [createStoredItem()] }),
    });
    const { result } = renderCart(storage);

    act(() => {
      result.current.updateItemQuantity("stored-1", 5);
    });

    expect(result.current.items[0]?.quantity).toBe(5);
    expect(readSnapshotItems(storage)[0]?.quantity).toBe(5);
  });

  it("removes the snapshot when the last line is removed", () => {
    const storage = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({ version: 1, items: [createStoredItem()] }),
    });
    const { result } = renderCart(storage);

    act(() => {
      result.current.removeItem("stored-1");
    });

    expect(result.current.items).toEqual([]);
    expect(storage.data.has(CART_STORAGE_KEY)).toBe(false);
  });

  it("removes the snapshot when the cart is cleared", () => {
    const storage = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({ version: 1, items: [createStoredItem()] }),
    });
    const { result } = renderCart(storage);

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(storage.data.has(CART_STORAGE_KEY)).toBe(false);
  });

  it("merges an edited line into an identical existing line", () => {
    const plain = createStoredItem({ id: "stored-1", quantity: 1 });
    const spicy = createStoredItem({
      id: "stored-2",
      variantSelections: [createSelection()],
      quantity: 2,
    });
    const storage = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({ version: 1, items: [plain, spicy] }),
    });
    const { result } = renderCart(storage);

    // Editing the spicy line back to the plain configuration must merge, not duplicate.
    act(() => {
      result.current.replaceItem("stored-2", {
        menu: createMenu(),
        variantSelections: [],
        quantity: 2,
        note: "",
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.id).toBe("stored-1");
    expect(result.current.items[0]?.quantity).toBe(3);
    expect(readSnapshotItems(storage)).toHaveLength(1);
  });

  it("replaces a line with a new configuration and persists it", () => {
    const storage = createMemoryStorage({
      [CART_STORAGE_KEY]: JSON.stringify({ version: 1, items: [createStoredItem()] }),
    });
    const { result } = renderCart(storage);

    act(() => {
      result.current.replaceItem("stored-1", {
        menu: createMenu(),
        variantSelections: [createSelection()],
        quantity: 1,
        note: "pedas",
      });
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]?.note).toBe("pedas");
    expect(result.current.items[0]?.variantSelections).toEqual([createSelection()]);
    expect(readSnapshotItems(storage)[0]?.note).toBe("pedas");
  });

  it("keeps working in memory when storage is unavailable", () => {
    const { result } = renderCart(null);

    act(() => {
      result.current.addItem({
        menu: createMenu(),
        variantSelections: [],
        quantity: 1,
        note: "",
      });
    });

    expect(result.current.items).toHaveLength(1);
  });

  it("throws when the cart hook is used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useStorefrontCart())).toThrow(
      "useStorefrontCart must be used inside StorefrontCartProvider",
    );
  });
});
