import type { InventoryIngredient } from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import { InMemoryAtomicDataTransaction } from "./InMemoryAtomicDataTransaction";
import { InMemoryInventoryRepository } from "./InMemoryInventoryRepository";
import { InMemoryOrderRepository } from "./InMemoryOrderRepository";
import { WARUNG_MENG_ORDER_FIXTURES } from "./WarungMengOrderMockData";

const ingredient: InventoryIngredient = {
  id: "rice",
  name: "Rice",
  baseUnit: "g",
  supplierId: null,
  status: "active",
  minimumStock: 100,
  lastPurchaseUnitCost: { amount: 10, currency: "IDR" },
  averageUnitCost: { amount: 10, currency: "IDR" },
};

function createResources() {
  let sequence = 0;
  const orders = new InMemoryOrderRepository(
    WARUNG_MENG_ORDER_FIXTURES,
    () => "2026-07-19T14:00:00.000Z",
    () => "event-generated",
    () => "order-generated",
  );
  const inventory = new InMemoryInventoryRepository(
    {
      ingredients: [ingredient],
      stockBalances: [
        {
          ingredientId: "rice",
          outletId: "wm-1",
          quantity: 1000,
          updatedAt: "2026-07-19T00:00:00.000Z",
        },
      ],
    },
    (kind) => `${kind}-${++sequence}`,
  );
  return {
    orders,
    inventory,
    transaction: new InMemoryAtomicDataTransaction({ orders, inventory }),
  };
}

async function riceBalance(inventory: InMemoryInventoryRepository): Promise<number> {
  const balances = await inventory.listStockBalances("wm-1");
  return balances.find((balance) => balance.ingredientId === "rice")?.quantity ?? Number.NaN;
}

async function recordRiceAdjustment(inventory: InMemoryInventoryRepository): Promise<void> {
  await inventory.recordMovement({
    ingredientId: "rice",
    outletId: "wm-1",
    type: "adjustment-out",
    quantity: 100,
    unit: "g",
    unitCost: null,
    referenceId: "tx-test",
    note: "",
    occurredAt: "2026-07-19T14:00:00.000Z",
  });
}

describe("InMemoryAtomicDataTransaction", () => {
  it("commits both order and inventory mutations when the callback resolves", async () => {
    const { orders, inventory, transaction } = createResources();

    const result = await transaction.run(async () => {
      const update = await orders.updateOrderStatus("order-1008", "cancelled");
      await recordRiceAdjustment(inventory);
      return update;
    });

    expect(result).toMatchObject({ status: "updated", order: { status: "cancelled" } });
    await expect(orders.getOrderById("order-1008")).resolves.toMatchObject({
      status: "cancelled",
    });
    await expect(riceBalance(inventory)).resolves.toBe(900);
  });

  it("rolls back every targeted mutation and rethrows when the callback rejects", async () => {
    const { orders, inventory, transaction } = createResources();

    await expect(
      transaction.run(async () => {
        await orders.updateOrderStatus("order-1008", "cancelled");
        await recordRiceAdjustment(inventory);
        throw new Error("reversal failed");
      }),
    ).rejects.toThrow("reversal failed");

    await expect(orders.getOrderById("order-1008")).resolves.toMatchObject({
      status: "new",
      paymentStatus: "paid",
    });
    await expect(riceBalance(inventory)).resolves.toBe(1000);
    await expect(inventory.listMovements({ ingredientId: "rice" })).resolves.toHaveLength(0);
  });

  it("keeps mutations committed before the transaction untouched by a later rollback", async () => {
    const { orders, inventory, transaction } = createResources();
    await orders.updateOrderStatus("order-1007", "preparing");

    await expect(
      transaction.run(async () => {
        await orders.updateOrderStatus("order-1008", "cancelled");
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    await expect(orders.getOrderById("order-1007")).resolves.toMatchObject({
      status: "preparing",
    });
    await expect(riceBalance(inventory)).resolves.toBe(1000);
  });

  it("supports a successful retry after a rolled-back run", async () => {
    const { orders, inventory, transaction } = createResources();

    await expect(
      transaction.run(async () => {
        await orders.updateOrderStatus("order-1008", "cancelled");
        throw new Error("first attempt fails");
      }),
    ).rejects.toThrow("first attempt fails");

    await transaction.run(async () => {
      await orders.updateOrderStatus("order-1008", "cancelled");
      await recordRiceAdjustment(inventory);
    });

    await expect(orders.getOrderById("order-1008")).resolves.toMatchObject({
      status: "cancelled",
      paymentStatus: "refunded",
    });
    await expect(riceBalance(inventory)).resolves.toBe(900);
  });

  it("serializes overlapping runs so a rollback never erases a concurrent commit", async () => {
    const { orders, inventory, transaction } = createResources();

    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const failing = transaction.run(async () => {
      await orders.updateOrderStatus("order-1008", "cancelled");
      await firstGate;
      throw new Error("late failure");
    });
    const succeeding = transaction.run(async () => {
      await recordRiceAdjustment(inventory);
      return "second done";
    });

    releaseFirst();
    await expect(failing).rejects.toThrow("late failure");
    await expect(succeeding).resolves.toBe("second done");

    await expect(orders.getOrderById("order-1008")).resolves.toMatchObject({ status: "new" });
    await expect(riceBalance(inventory)).resolves.toBe(900);
  });
});
