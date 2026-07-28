import type { InventoryIngredient, MenuRecipe, Order } from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import { InMemoryInventoryRepository } from "./InMemoryInventoryRepository";

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
const recipe: MenuRecipe = {
  menuItemId: "menu-rice",
  components: [
    { id: "rice-component", ingredientId: "rice", quantity: 100, unit: "g", wastePercentage: 0 },
  ],
  packagingCost: { amount: 0, currency: "IDR" },
  additionalCost: { amount: 0, currency: "IDR" },
  updatedAt: "2026-07-19T00:00:00.000Z",
};

function createRepository() {
  let sequence = 0;
  return new InMemoryInventoryRepository(
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
      recipes: [recipe],
    },
    (kind) => `${kind}-${++sequence}`,
  );
}

function createOrder(quantity: number): Order {
  const amount = quantity * 10_000;
  return {
    id: "order-1",
    orderNumber: "WM-001",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    channel: "pos",
    fulfillment: "dine-in",
    paymentStatus: "paid",
    paymentMethod: "cash",
    status: "new",
    customer: null,
    items: [
      {
        id: "order-item-1",
        menuItemId: "menu-rice",
        name: "Rice",
        quantity,
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
    createdAt: "2026-07-19T02:00:00.000Z",
    updatedAt: "2026-07-19T02:00:00.000Z",
    events: [],
  };
}

describe("InMemoryInventoryRepository", () => {
  it("records a movement and updates stock", async () => {
    const repository = createRepository();
    await repository.recordMovement({
      ingredientId: "rice",
      outletId: "wm-1",
      type: "waste",
      quantity: 200,
      unit: "g",
      unitCost: null,
      referenceId: null,
      note: "Damaged",
      occurredAt: "2026-07-19T01:00:00.000Z",
    });
    expect((await repository.listStockBalances("wm-1"))[0]?.quantity).toBe(800);
  });

  it("rejects a movement that creates negative stock", async () => {
    const repository = createRepository();
    await expect(
      repository.recordMovement({
        ingredientId: "rice",
        outletId: "wm-1",
        type: "waste",
        quantity: 1001,
        unit: "g",
        unitCost: null,
        referenceId: null,
        note: "Damaged",
        occurredAt: "2026-07-19T01:00:00.000Z",
      }),
    ).rejects.toThrow(RangeError);
  });

  it("calculates HPP from the current average cost", async () => {
    const repository = createRepository();
    expect((await repository.calculateHpp("menu-rice"))?.total.amount).toBe(1000);
  });

  it("updates last and weighted-average costs after a purchase", async () => {
    const repository = createRepository();
    await repository.recordMovement({
      ingredientId: "rice",
      outletId: "wm-1",
      type: "purchase",
      quantity: 1,
      unit: "kg",
      unitCost: { amount: 20_000, currency: "IDR" },
      referenceId: "purchase-1",
      note: "Restock",
      occurredAt: "2026-07-19T01:00:00.000Z",
    });

    await expect(repository.getIngredientById("rice")).resolves.toMatchObject({
      lastPurchaseUnitCost: { amount: 20, currency: "IDR" },
      averageUnitCost: { amount: 15, currency: "IDR" },
    });
    await expect(repository.listStockBalances("wm-1")).resolves.toMatchObject([
      { ingredientId: "rice", quantity: 2000 },
    ]);
  });

  it("atomically consumes recipe stock for an order", async () => {
    const repository = createRepository();
    const order = createOrder(2);
    const movements = await repository.consumeOrder(order);
    expect(movements).toHaveLength(1);
    expect((await repository.listStockBalances("wm-1"))[0]?.quantity).toBe(800);
  });

  it("does not partially consume when projected stock is insufficient", async () => {
    const repository = createRepository();
    const order = createOrder(11);
    await expect(repository.consumeOrder(order)).rejects.toThrow(RangeError);
    expect((await repository.listStockBalances("wm-1"))[0]?.quantity).toBe(1000);
  });

  it("consumes an order idempotently by order reference (QA-ADM-006)", async () => {
    const repository = createRepository();
    const order = createOrder(2);

    await repository.consumeOrder(order);
    const repeat = await repository.consumeOrder(order);

    expect(repeat).toHaveLength(1);
    const movements = await repository.listMovements({ type: "consumption" });
    expect(movements).toHaveLength(1);
    expect((await repository.listStockBalances("wm-1"))[0]?.quantity).toBe(800);
  });

  it("reverses order consumption once with one adjustment per movement (QA-ADM-005)", async () => {
    const repository = createRepository();
    const order = createOrder(2);
    await repository.consumeOrder(order);

    const reversal = await repository.revertOrderConsumption(order);
    expect(reversal).toHaveLength(1);
    expect(reversal[0]).toMatchObject({
      type: "adjustment-in",
      referenceId: "order-1",
      quantity: 200,
      unit: "g",
    });
    expect((await repository.listStockBalances("wm-1"))[0]?.quantity).toBe(1000);

    const repeat = await repository.revertOrderConsumption(order);
    expect(repeat).toHaveLength(1);
    expect(await repository.listMovements({ type: "adjustment-in" })).toHaveLength(1);
    expect((await repository.listStockBalances("wm-1"))[0]?.quantity).toBe(1000);
  });

  it("does nothing when reversing an order that never consumed stock", async () => {
    const repository = createRepository();

    await expect(repository.revertOrderConsumption(createOrder(1))).resolves.toEqual([]);
    expect(await repository.listMovements()).toHaveLength(0);
    expect((await repository.listStockBalances("wm-1"))[0]?.quantity).toBe(1000);
  });

  it("restores balances, movements, and recipes to the exact snapshot state", async () => {
    const repository = createRepository();
    const snapshot = repository.captureSnapshot();

    await repository.consumeOrder(createOrder(2));
    await repository.saveRecipe({ ...recipe, additionalCost: { amount: 999, currency: "IDR" } });

    repository.restoreSnapshot(snapshot);

    expect(await repository.listMovements()).toHaveLength(0);
    expect((await repository.listStockBalances("wm-1"))[0]?.quantity).toBe(1000);
    await expect(repository.getRecipeByMenuItemId("menu-rice")).resolves.toMatchObject({
      additionalCost: { amount: 0 },
    });
  });
});
