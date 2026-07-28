import { InMemoryInventoryRepository, InMemoryOrderRepository } from "@warungmeng/data";
import type { MenuItem } from "@warungmeng/domain";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PosCheckoutPort } from "./ports/posCheckoutPort";
import type { PosSessionStoragePort } from "./ports/posSessionStoragePort";
import { deserializePosCashierState, serializePosCashierState } from "./posSessionPersistence";
import { PosSessionStore, type PosCashierState } from "./posSessionStore";
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

function createCheckoutPort(
  repository: InMemoryOrderRepository,
  inventory?: InMemoryInventoryRepository,
): PosCheckoutPort {
  return {
    createOrder: (input) => repository.createOrder(input),
    getOrderById: (id) => repository.getOrderById(id),
    consumeOrder: (order) => (inventory ? inventory.consumeOrder(order) : Promise.resolve([])),
  };
}

function createMemoryStorage(): PosSessionStoragePort & { corrupt: () => void } {
  let stored: string | null = null;
  return {
    load: () => (stored === null ? null : deserializePosCashierState(stored)),
    save(state: PosCashierState) {
      stored = serializePosCashierState(state);
    },
    clear() {
      stored = null;
    },
    corrupt() {
      stored = "{definitely not a session";
    },
  };
}

const teaInventorySeed = (quantity: number) => ({
  ingredients: [
    {
      id: "ingredient-tea",
      name: "Tea",
      baseUnit: "g" as const,
      supplierId: null,
      status: "active" as const,
      minimumStock: 0,
      lastPurchaseUnitCost: { amount: 100, currency: "IDR" as const },
      averageUnitCost: { amount: 100, currency: "IDR" as const },
    },
  ],
  stockBalances: [
    {
      ingredientId: "ingredient-tea",
      outletId: "wm-1",
      quantity,
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
          unit: "g" as const,
          wastePercentage: 0,
        },
      ],
      packagingCost: { amount: 0, currency: "IDR" as const },
      additionalCost: { amount: 0, currency: "IDR" as const },
      updatedAt: "2026-07-19T00:00:00.000Z",
    },
  ],
});

describe("usePosCashier", () => {
  it("opens a session, checks out, and persists the POS order", async () => {
    const repository = new InMemoryOrderRepository([], undefined, undefined, () => "order-pos-1");
    const inventory = new InMemoryInventoryRepository(teaInventorySeed(100));
    let id = 0;
    const store = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" });
    const { result } = renderHook(() =>
      usePosCashier(createCheckoutPort(repository, inventory), store, {
        now: () => new Date(2026, 6, 19, 10, 0, 0),
        id: () => String(++id),
      }),
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
    const inventory = new InMemoryInventoryRepository(teaInventorySeed(0));
    let id = 0;
    const store = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" });
    const { result } = renderHook(() =>
      usePosCashier(createCheckoutPort(repository, inventory), store, {
        now: () => new Date(2026, 6, 19, 10, 0, 0),
        id: () => String(++id),
      }),
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
    expect(result.current.pendingInventorySyncs).toMatchObject([
      { orderId: "order-pos-2", orderNumber: "WM-POS-260719-100000-001" },
    ]);
    await expect(repository.listOrders()).resolves.toHaveLength(1);
    await expect(inventory.listStockBalances("wm-1")).resolves.toMatchObject([
      { ingredientId: "ingredient-tea", quantity: 0 },
    ]);

    // QA-ADM-006: after restocking, the failed sync can be retried safely.
    await inventory.recordMovement({
      ingredientId: "ingredient-tea",
      outletId: "wm-1",
      type: "purchase",
      quantity: 100,
      unit: "g",
      unitCost: { amount: 100, currency: "IDR" },
      referenceId: null,
      note: "Restock",
      occurredAt: "2026-07-19T11:00:00.000Z",
    });
    await act(async () => {
      await expect(result.current.retryInventorySync("order-pos-2")).resolves.toBe(true);
    });
    expect(result.current.pendingInventorySyncs).toEqual([]);
    await expect(inventory.listMovements({ type: "consumption" })).resolves.toHaveLength(1);
    await expect(inventory.listStockBalances("wm-1")).resolves.toMatchObject([
      { ingredientId: "ingredient-tea", quantity: 92 },
    ]);

    // A second retry is a no-op: the order is no longer pending.
    await act(async () => {
      await expect(result.current.retryInventorySync("order-pos-2")).resolves.toBe(false);
    });
    await expect(inventory.listMovements({ type: "consumption" })).resolves.toHaveLength(1);
  });

  it("keeps the open session, cart, and opening balance across unmount/remount (QA-ADM-003)", () => {
    const repository = new InMemoryOrderRepository();
    const store = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" });
    const runtime = { now: () => new Date(2026, 6, 21, 9, 0, 0), id: () => "fixed" };
    const first = renderHook(() => usePosCashier(createCheckoutPort(repository), store, runtime));

    act(() => {
      first.result.current.setOpeningBalance(100_000);
      first.result.current.startSession();
      first.result.current.addMenu(menu, [], "Less ice");
    });
    const openedAt =
      first.result.current.session.status === "open" ? first.result.current.session.openedAt : null;
    first.unmount();

    const second = renderHook(() => usePosCashier(createCheckoutPort(repository), store, runtime));
    expect(second.result.current.session).toMatchObject({
      status: "open",
      outlet: { id: "wm-1" },
      openingBalance: { amount: 100_000 },
      openedAt,
    });
    expect(second.result.current.items).toMatchObject([{ name: "ES TEH JUMBO" }]);
  });

  it("restores an open session with pending syncs from storage and resets processing", async () => {
    const repository = new InMemoryOrderRepository([], undefined, undefined, () => "order-pos-9");
    const inventory = new InMemoryInventoryRepository(teaInventorySeed(0));
    const storage = createMemoryStorage();
    let id = 0;
    const runtime = { now: () => new Date(2026, 6, 21, 9, 0, 0), id: () => String(++id) };
    const firstStore = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" }, storage);
    const first = renderHook(() =>
      usePosCashier(createCheckoutPort(repository, inventory), firstStore, runtime),
    );

    act(() => {
      first.result.current.setOpeningBalance(50_000);
      first.result.current.startSession();
      first.result.current.addMenu(menu, [], "");
      first.result.current.updateCheckout({ paymentMethod: "qris" });
    });
    await act(async () => {
      await first.result.current.completeCheckout();
    });
    expect(first.result.current.pendingInventorySyncs).toHaveLength(1);
    first.unmount();

    // Reload semantics: a brand-new store over the same storage restores the
    // session, pending sync queue, and sequence — with processing false.
    const reloadedStore = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" }, storage);
    const second = renderHook(() =>
      usePosCashier(createCheckoutPort(repository, inventory), reloadedStore, runtime),
    );
    expect(second.result.current.session).toMatchObject({ status: "open" });
    expect(second.result.current.processing).toBe(false);
    expect(second.result.current.pendingInventorySyncs).toMatchObject([{ orderId: "order-pos-9" }]);
  });

  it("falls back to a clean closed session when the stored payload is corrupt", () => {
    const storage = createMemoryStorage();
    const seeded = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" }, storage);
    seeded.update((current) => ({ ...current, openingBalance: 75_000 }));

    storage.corrupt();
    const recovered = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" }, storage);
    expect(recovered.getState()).toMatchObject({
      session: { status: "closed" },
      openingBalance: 0,
      items: [],
      pendingInventorySyncs: [],
      processing: false,
      sequence: 1,
    });
  });

  it("closes with a cash reconciliation record and rejects double close (QA-ADM-004)", async () => {
    const repository = new InMemoryOrderRepository([], undefined, undefined, () => "order-pos-3");
    const store = new PosSessionStore({ id: "wm-1", name: "WARUNG MENG" });
    let id = 0;
    const runtime = { now: () => new Date(2026, 6, 21, 9, 0, 0), id: () => String(++id) };
    const { result } = renderHook(() =>
      usePosCashier(createCheckoutPort(repository), store, runtime),
    );

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
