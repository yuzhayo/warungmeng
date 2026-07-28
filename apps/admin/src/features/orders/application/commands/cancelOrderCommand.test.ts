import {
  InMemoryAtomicDataTransaction,
  InMemoryInventoryRepository,
  InMemoryOrderRepository,
  WARUNG_MENG_ORDER_FIXTURES,
} from "@warungmeng/data";
import {
  projectOrderToFinanceTransactions,
  type FinanceTransaction,
  type Order,
} from "@warungmeng/domain";
import { describe, expect, it, vi } from "vitest";
import { cancelOrderAtomically, type CancelOrderPorts } from "./cancelOrderCommand";

const PAID_ORDER_ID = "order-1008";
const UNPAID_ORDER_ID = "order-1006";

function projectRefund(order: Order): readonly FinanceTransaction[] {
  return projectOrderToFinanceTransactions(order).filter(
    (transaction) => transaction.type === "refund",
  );
}

function createHarness() {
  const orders = new InMemoryOrderRepository(
    WARUNG_MENG_ORDER_FIXTURES,
    () => "2026-07-19T14:00:00.000Z",
    () => "event-generated",
    () => "order-generated",
  );
  let sequence = 0;
  const inventory = new InMemoryInventoryRepository(
    {
      ingredients: [
        {
          id: "rice",
          name: "Rice",
          baseUnit: "g",
          supplierId: null,
          status: "active",
          minimumStock: 100,
          lastPurchaseUnitCost: { amount: 10, currency: "IDR" },
          averageUnitCost: { amount: 10, currency: "IDR" },
        },
      ],
      // The paid order already consumed 200 g: the balance is post-consumption
      // and the consumption movement references the order.
      stockBalances: [
        {
          ingredientId: "rice",
          outletId: "wm-1",
          quantity: 800,
          updatedAt: "2026-07-19T13:40:00.000Z",
        },
      ],
      movements: [
        {
          id: "movement-consume-1008",
          ingredientId: "rice",
          outletId: "wm-1",
          type: "consumption",
          quantity: 200,
          unit: "g",
          baseQuantityDelta: -200,
          unitCost: null,
          referenceId: PAID_ORDER_ID,
          note: "",
          occurredAt: "2026-07-19T13:40:00.000Z",
        },
      ],
    },
    (kind) => `${kind}-${++sequence}`,
  );
  const transaction = new InMemoryAtomicDataTransaction({ orders, inventory });
  const finance = { projectRefund: vi.fn(projectRefund) };
  const reversal = vi.fn((order: Order) => inventory.revertOrderConsumption(order));
  const ports: CancelOrderPorts = {
    orders,
    inventory: { revertOrderConsumption: reversal },
    finance,
    transaction,
  };

  async function riceBalance(): Promise<number> {
    const balances = await inventory.listStockBalances("wm-1");
    return balances.find((balance) => balance.ingredientId === "rice")?.quantity ?? Number.NaN;
  }

  return { orders, inventory, transaction, finance, reversal, ports, riceBalance };
}

describe("cancelOrderAtomically", () => {
  it("commits a paid cancellation with exactly one refund projection and one reversal", async () => {
    const harness = createHarness();

    const outcome = await cancelOrderAtomically(harness.ports, PAID_ORDER_ID);

    expect(outcome).toMatchObject({ status: "cancelled", refunded: true });
    await expect(harness.orders.getOrderById(PAID_ORDER_ID)).resolves.toMatchObject({
      status: "cancelled",
      paymentStatus: "refunded",
    });

    // The refund projection was derived from the settled (cancelled) order —
    // the exact order the command transitioned, not a recomputed sibling.
    expect(harness.finance.projectRefund).toHaveBeenCalledTimes(1);
    expect(harness.finance.projectRefund).toHaveBeenCalledWith(
      expect.objectContaining({ id: PAID_ORDER_ID, status: "cancelled" }),
    );

    // Exactly one inventory reversal, applied through the injected port.
    expect(harness.reversal).toHaveBeenCalledTimes(1);
    await expect(harness.inventory.listMovements({ type: "adjustment-in" })).resolves.toHaveLength(
      1,
    );
    await expect(harness.riceBalance()).resolves.toBe(1000);
  });

  it("retry after success is rejected as invalid transition without duplicating effects", async () => {
    const harness = createHarness();
    await cancelOrderAtomically(harness.ports, PAID_ORDER_ID);

    const retry = await cancelOrderAtomically(harness.ports, PAID_ORDER_ID);

    expect(retry).toMatchObject({ status: "invalid-transition" });
    expect(harness.reversal).toHaveBeenCalledTimes(1);
    await expect(harness.inventory.listMovements({ type: "adjustment-in" })).resolves.toHaveLength(
      1,
    );
    await expect(harness.riceBalance()).resolves.toBe(1000);
  });

  it("cancels an unpaid order without refund or reversal", async () => {
    const harness = createHarness();

    const outcome = await cancelOrderAtomically(harness.ports, UNPAID_ORDER_ID);

    expect(outcome).toMatchObject({ status: "cancelled", refunded: false });
    await expect(harness.orders.getOrderById(UNPAID_ORDER_ID)).resolves.toMatchObject({
      status: "cancelled",
      paymentStatus: "unpaid",
    });
    expect(harness.reversal).not.toHaveBeenCalled();
    await expect(harness.inventory.listMovements({ type: "adjustment-in" })).resolves.toHaveLength(
      0,
    );
  });

  it("rolls back the order transition when the reversal fails", async () => {
    const harness = createHarness();
    const failingPorts: CancelOrderPorts = {
      ...harness.ports,
      inventory: {
        revertOrderConsumption: () => Promise.reject(new Error("reversal offline")),
      },
    };

    const outcome = await cancelOrderAtomically(failingPorts, PAID_ORDER_ID);

    expect(outcome).toEqual({
      status: "failed",
      reason: "inventory-reversal",
      retryable: true,
      dataChanged: false,
    });
    // The already-applied order transition was rolled back: no
    // cancelled/refunded order with a failed reversal can exist.
    await expect(harness.orders.getOrderById(PAID_ORDER_ID)).resolves.toMatchObject({
      status: "new",
      paymentStatus: "paid",
    });
    await expect(harness.inventory.listMovements({ type: "adjustment-in" })).resolves.toHaveLength(
      0,
    );
    await expect(harness.riceBalance()).resolves.toBe(800);
  });

  it("rolls back both order and inventory when failure strikes after both mutations", async () => {
    const harness = createHarness();
    const lateFailurePorts: CancelOrderPorts = {
      ...harness.ports,
      inventory: {
        revertOrderConsumption: async (order) => {
          // Real inventory mutation happens first, then the failure — the
          // transaction must restore inventory too, not only the order.
          await harness.inventory.revertOrderConsumption(order);
          throw new Error("late failure");
        },
      },
    };

    const outcome = await cancelOrderAtomically(lateFailurePorts, PAID_ORDER_ID);

    expect(outcome).toMatchObject({ status: "failed", dataChanged: false, retryable: true });
    await expect(harness.orders.getOrderById(PAID_ORDER_ID)).resolves.toMatchObject({
      status: "new",
      paymentStatus: "paid",
    });
    await expect(harness.inventory.listMovements({ type: "adjustment-in" })).resolves.toHaveLength(
      0,
    );
    await expect(harness.riceBalance()).resolves.toBe(800);
  });

  it("reports a transaction failure when the status update itself throws", async () => {
    const harness = createHarness();
    const brokenPorts: CancelOrderPorts = {
      ...harness.ports,
      orders: {
        updateOrderStatus: () => Promise.reject(new Error("storage offline")),
      },
    };

    const outcome = await cancelOrderAtomically(brokenPorts, PAID_ORDER_ID);

    expect(outcome).toEqual({
      status: "failed",
      reason: "transaction",
      retryable: true,
      dataChanged: false,
    });
    await expect(harness.orders.getOrderById(PAID_ORDER_ID)).resolves.toMatchObject({
      status: "new",
    });
  });

  it("succeeds on retry after a rolled-back failure without duplicating effects", async () => {
    const harness = createHarness();
    let attempts = 0;
    const flakyPorts: CancelOrderPorts = {
      ...harness.ports,
      inventory: {
        revertOrderConsumption: async (order) => {
          attempts += 1;
          if (attempts === 1) throw new Error("transient failure");
          return harness.inventory.revertOrderConsumption(order);
        },
      },
    };

    const first = await cancelOrderAtomically(flakyPorts, PAID_ORDER_ID);
    expect(first).toMatchObject({ status: "failed", dataChanged: false });

    const second = await cancelOrderAtomically(flakyPorts, PAID_ORDER_ID);
    expect(second).toMatchObject({ status: "cancelled", refunded: true });

    await expect(harness.inventory.listMovements({ type: "adjustment-in" })).resolves.toHaveLength(
      1,
    );
    await expect(harness.riceBalance()).resolves.toBe(1000);
  });

  it("leaves everything untouched for a missing order", async () => {
    const harness = createHarness();

    const outcome = await cancelOrderAtomically(harness.ports, "missing-order");

    expect(outcome).toEqual({ status: "not-found" });
    expect(harness.finance.projectRefund).not.toHaveBeenCalled();
    expect(harness.reversal).not.toHaveBeenCalled();
    await expect(harness.riceBalance()).resolves.toBe(800);
  });

  it("rejects an invalid transition without mutating anything", async () => {
    const harness = createHarness();
    // order-1003 is already cancelled in the fixtures.
    const outcome = await cancelOrderAtomically(harness.ports, "order-1003");

    expect(outcome).toMatchObject({
      status: "invalid-transition",
      order: expect.objectContaining({ id: "order-1003", status: "cancelled" }),
    });
    expect(harness.reversal).not.toHaveBeenCalled();
    await expect(harness.inventory.listMovements({ type: "adjustment-in" })).resolves.toHaveLength(
      0,
    );
  });
});
