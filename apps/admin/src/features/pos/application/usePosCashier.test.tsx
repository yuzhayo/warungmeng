import { InMemoryInventoryRepository, InMemoryOrderRepository } from "@warungmeng/data";
import type { MenuItem } from "@warungmeng/domain";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePosCashier } from "./usePosCashier";

const menu: MenuItem = {
  id: "menu-1",
  name: "ES TEH JUMBO",
  slug: "es-teh-jumbo",
  categoryId: "drink",
  description: "",
  image: null,
  price: { amount: 6_000, currency: "IDR" },
  compareAtPrice: null,
  availability: { status: "available" },
  inventory: { mode: "untracked" },
  visibility: "visible",
  salesSchedule: { mode: "always" },
  variantGroupIds: [],
  sortOrder: 0,
};

describe("usePosCashier", () => {
  it("opens a session, checks out, and persists the POS order", async () => {
    const repository = new InMemoryOrderRepository([], undefined, undefined, () => "order-pos-1");
    const inventory = new InMemoryInventoryRepository({
      ingredients: [
        {
          id: "ingredient-tea",
          name: "Tea",
          baseUnit: "g",
          supplierId: null,
          status: "active",
          minimumStock: 0,
          lastPurchaseUnitCost: { amount: 100, currency: "IDR" },
          averageUnitCost: { amount: 100, currency: "IDR" },
        },
      ],
      stockBalances: [
        {
          ingredientId: "ingredient-tea",
          outletId: "wm-1",
          quantity: 100,
          updatedAt: "2026-07-19T00:00:00.000Z",
        },
      ],
      recipes: [
        {
          menuItemId: "menu-1",
          components: [
            {
              id: "recipe-tea",
              ingredientId: "ingredient-tea",
              quantity: 8,
              unit: "g",
              wastePercentage: 0,
            },
          ],
          packagingCost: { amount: 0, currency: "IDR" },
          additionalCost: { amount: 0, currency: "IDR" },
          updatedAt: "2026-07-19T00:00:00.000Z",
        },
      ],
    });
    let id = 0;
    const { result } = renderHook(() =>
      usePosCashier(
        repository,
        { id: "wm-1", name: "WARUNG MENG" },
        {
          now: () => new Date(2026, 6, 19, 10, 0, 0),
          id: () => String(++id),
        },
        inventory,
      ),
    );

    act(() => {
      result.current.startSession();
      result.current.addMenu(menu, [], "Less ice");
      result.current.updateCheckout({ paymentMethod: "qris" });
    });

    await act(async () => {
      await result.current.completeCheckout();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.receipt).toMatchObject({
      orderId: "order-pos-1",
      orderNumber: "WM-POS-260719-100000-001",
      paymentMethod: "qris",
    });
    await expect(repository.getOrderById("order-pos-1")).resolves.toMatchObject({
      channel: "pos",
      status: "new",
      paymentStatus: "paid",
      items: [{ name: "ES TEH JUMBO", note: "Less ice" }],
    });
    await expect(inventory.listStockBalances("wm-1")).resolves.toMatchObject([
      { ingredientId: "ingredient-tea", quantity: 92 },
    ]);
  });

  it("keeps a persisted checkout successful when inventory synchronization fails", async () => {
    const repository = new InMemoryOrderRepository([], undefined, undefined, () => "order-pos-2");
    const inventory = new InMemoryInventoryRepository({
      ingredients: [
        {
          id: "ingredient-tea",
          name: "Tea",
          baseUnit: "g",
          supplierId: null,
          status: "active",
          minimumStock: 0,
          lastPurchaseUnitCost: { amount: 100, currency: "IDR" },
          averageUnitCost: { amount: 100, currency: "IDR" },
        },
      ],
      stockBalances: [
        {
          ingredientId: "ingredient-tea",
          outletId: "wm-1",
          quantity: 0,
          updatedAt: "2026-07-19T00:00:00.000Z",
        },
      ],
      recipes: [
        {
          menuItemId: "menu-1",
          components: [
            {
              id: "recipe-tea",
              ingredientId: "ingredient-tea",
              quantity: 8,
              unit: "g",
              wastePercentage: 0,
            },
          ],
          packagingCost: { amount: 0, currency: "IDR" },
          additionalCost: { amount: 0, currency: "IDR" },
          updatedAt: "2026-07-19T00:00:00.000Z",
        },
      ],
    });
    let id = 0;
    const { result } = renderHook(() =>
      usePosCashier(
        repository,
        { id: "wm-1", name: "WARUNG MENG" },
        {
          now: () => new Date(2026, 6, 19, 10, 0, 0),
          id: () => String(++id),
        },
        inventory,
      ),
    );

    act(() => {
      result.current.startSession();
      result.current.addMenu(menu, [], "");
      result.current.updateCheckout({ paymentMethod: "qris" });
    });

    let checkoutResult: Awaited<ReturnType<typeof result.current.completeCheckout>> = null;
    await act(async () => {
      checkoutResult = await result.current.completeCheckout();
    });

    expect(checkoutResult).toMatchObject({
      receipt: { orderId: "order-pos-2" },
      inventorySyncError: true,
    });
    expect(result.current.items).toEqual([]);
    expect(result.current.inventorySyncError).toBe(true);
    await expect(repository.listOrders()).resolves.toHaveLength(1);
    await expect(inventory.listStockBalances("wm-1")).resolves.toMatchObject([
      { ingredientId: "ingredient-tea", quantity: 0 },
    ]);
  });
});
