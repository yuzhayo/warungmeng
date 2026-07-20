import { InMemoryInventoryRepository, InMemoryOrderRepository } from "@warungmeng/data";
import type { MenuItem } from "@warungmeng/domain";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PosSessionStore } from "./posSessionStore";
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
    const store = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" });
    const { result } = renderHook(() =>
      usePosCashier(
        repository,
        {
          now: () => new Date(2026, 6, 19, 10, 0, 0),
          id: () => String(++id),
        },
        inventory,
        store,
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
    const store = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" });
    const { result } = renderHook(() =>
      usePosCashier(
        repository,
        {
          now: () => new Date(2026, 6, 19, 10, 0, 0),
          id: () => String(++id),
        },
        inventory,
        store,
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

  it("keeps the open session, cart, and opening balance across unmount/remount (QA-ADM-003)", () => {
    const repository = new InMemoryOrderRepository();
    const store = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" });
    const runtime = { now: () => new Date(2026, 6, 21, 9, 0, 0), id: () => "fixed" };
    const first = renderHook(() => usePosCashier(repository, runtime, undefined, store));

    act(() => {
      first.result.current.setOpeningBalance(100_000);
      first.result.current.startSession();
      first.result.current.addMenu(menu, [], "Less ice");
    });
    const openedAt =
      first.result.current.session.status === "open" ? first.result.current.session.openedAt : null;
    first.unmount();

    const second = renderHook(() => usePosCashier(repository, runtime, undefined, store));
    expect(second.result.current.session).toMatchObject({
      status: "open",
      outlet: { id: "wm-1" },
      openingBalance: { amount: 100_000 },
      openedAt,
    });
    expect(second.result.current.items).toMatchObject([{ name: "ES TEH JUMBO" }]);
  });

  it("closes with a cash reconciliation record and rejects double close (QA-ADM-004)", async () => {
    const repository = new InMemoryOrderRepository([], undefined, undefined, () => "order-pos-3");
    const store = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" });
    let id = 0;
    const runtime = { now: () => new Date(2026, 6, 21, 9, 0, 0), id: () => String(++id) };
    const { result } = renderHook(() => usePosCashier(repository, runtime, undefined, store));

    act(() => {
      result.current.setOpeningBalance(100_000);
      result.current.startSession();
      result.current.addMenu(menu, [], "");
      result.current.updateCheckout({ paymentMethod: "cash", cashReceived: 10_000 });
    });
    await act(async () => {
      await result.current.completeCheckout();
    });

    const total = 6_600; // 6.000 + 10% tax, rounded to Rp100
    expect(result.current.cashSales).toBe(total);
    expect(result.current.expectedCash).toBe(100_000 + total);

    let record: ReturnType<typeof result.current.endSession> = null;
    act(() => {
      record = result.current.endSession(100_000 + total - 5_000);
    });
    expect(record).toMatchObject({
      openingBalance: { amount: 100_000 },
      cashSales: { amount: total },
      expectedCash: { amount: 100_000 + total },
      actualCash: { amount: 100_000 + total - 5_000 },
      variance: { amount: -5_000 },
    });
    expect(result.current.session.status).toBe("closed");
    expect(result.current.lastCloseRecord).toEqual(record);

    // Closing again is a no-op: the session is already closed.
    let secondRecord: ReturnType<typeof result.current.endSession> = null;
    act(() => {
      secondRecord = result.current.endSession(0);
    });
    expect(secondRecord).toBeNull();
    expect(result.current.lastCloseRecord).toEqual(record);
  });
});
