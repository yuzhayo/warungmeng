import {
  InMemoryInventoryRepository,
  InMemoryOrderRepository,
} from "@warungmeng/data";
import { projectOrderToFinanceTransactions, type Order } from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import { cancelOrderWithSettlement } from "./cancelOrderCommand";

function createOrder(paymentStatus: Order["paymentStatus"]): Order {
  const amount = 20_000;
  return {
    id: "order-1",
    orderNumber: "WM-POS-260721-0001",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    channel: "pos",
    fulfillment: "dine-in",
    paymentStatus,
    paymentMethod: "cash",
    status: "new",
    customer: null,
    items: [
      {
        id: "item-1",
        menuItemId: "menu-rice",
        name: "Rice",
        quantity: 2,
        unitPrice: { amount: 10_000, currency: "IDR" },
        variantSelections: [],
        note: "",
        lineTotal: { amount, currency: "IDR" },
      },
    ],
    totals: {
      subtotal: { amount, currency: "IDR" },
      discount: { amount: 0, currency: "IDR" },
      tax: { amount: 0, currency: "IDR" },
      serviceCharge: { amount: 0, currency: "IDR" },
      rounding: { amount: 0, currency: "IDR" },
      total: { amount, currency: "IDR" },
    },
    customerNote: "",
    internalNote: "",
    createdAt: "2026-07-21T02:00:00.000Z",
    updatedAt: "2026-07-21T02:00:00.000Z",
    events: [],
  };
}

function createInventory() {
  let sequence = 0;
  return new InMemoryInventoryRepository(
    {
      ingredients: [
        {
          id: "rice",
          name: "Rice",
          baseUnit: "g",
          supplierId: null,
          status: "active",
          minimumStock: 0,
          lastPurchaseUnitCost: { amount: 10, currency: "IDR" },
          averageUnitCost: { amount: 10, currency: "IDR" },
        },
      ],
      stockBalances: [
        { ingredientId: "rice", outletId: "wm-1", quantity: 1000, updatedAt: "2026-07-21" },
      ],
      recipes: [
        {
          menuItemId: "menu-rice",
          components: [
            { id: "c-1", ingredientId: "rice", quantity: 100, unit: "g", wastePercentage: 0 },
          ],
          packagingCost: { amount: 0, currency: "IDR" },
          additionalCost: { amount: 0, currency: "IDR" },
          updatedAt: "2026-07-21",
        },
      ],
    },
    (kind) => `${kind}-${++sequence}`,
  );
}

describe("cancelOrderWithSettlement (QA-ADM-005)", () => {
  it("cancels a paid order with one refund offset and one reversal per movement", async () => {
    const orders = new InMemoryOrderRepository([createOrder("paid")]);
    const inventory = createInventory();
    await inventory.consumeOrder(createOrder("paid"));
    expect((await inventory.listStockBalances("wm-1"))[0]?.quantity).toBe(800);

    const outcome = await cancelOrderWithSettlement(orders, inventory, "order-1");

    expect(outcome).toMatchObject({ refunded: true, stockReversalFailed: false });
    const order = await orders.getOrderById("order-1");
    expect(order).toMatchObject({ status: "cancelled", paymentStatus: "refunded" });

    const finance = projectOrderToFinanceTransactions(order!);
    expect(finance).toHaveLength(2);
    expect(finance.filter((tx) => tx.type === "sale")).toHaveLength(1);
    expect(finance.filter((tx) => tx.type === "refund")).toHaveLength(1);

    expect(await inventory.listMovements({ type: "consumption" })).toHaveLength(1);
    expect(await inventory.listMovements({ type: "adjustment-in" })).toHaveLength(1);
    expect((await inventory.listStockBalances("wm-1"))[0]?.quantity).toBe(1000);
  });

  it("stays unchanged when the command is retried", async () => {
    const orders = new InMemoryOrderRepository([createOrder("paid")]);
    const inventory = createInventory();
    await inventory.consumeOrder(createOrder("paid"));

    await cancelOrderWithSettlement(orders, inventory, "order-1");
    const retry = await cancelOrderWithSettlement(orders, inventory, "order-1");

    expect(retry.result.status).toBe("invalid-transition");
    expect(retry).toMatchObject({ refunded: true, stockReversalFailed: false });
    const order = await orders.getOrderById("order-1");
    expect(projectOrderToFinanceTransactions(order!)).toHaveLength(2);
    expect(await inventory.listMovements({ type: "adjustment-in" })).toHaveLength(1);
    expect((await inventory.listStockBalances("wm-1"))[0]?.quantity).toBe(1000);
  });

  it("cancels an unpaid order without refund or reversal", async () => {
    const orders = new InMemoryOrderRepository([createOrder("unpaid")]);
    const inventory = createInventory();

    const outcome = await cancelOrderWithSettlement(orders, inventory, "order-1");

    expect(outcome).toMatchObject({ refunded: false, stockReversalFailed: false });
    const order = await orders.getOrderById("order-1");
    expect(order).toMatchObject({ status: "cancelled", paymentStatus: "unpaid" });
    expect(projectOrderToFinanceTransactions(order!)).toHaveLength(0);
    expect(await inventory.listMovements()).toHaveLength(0);
  });
});
