import { describe, expect, it } from "vitest";
import type { Order } from "../orders/types";
import { summarizeFinanceTransactions } from "./calculations";
import type { FinanceTransaction } from "./types";
import {
  buildFinanceLedger,
  projectOrdersToFinanceTransactions,
  projectOrderToFinanceTransactions,
} from "./ledger";

function createOrder(patch: Partial<Order> = {}): Order {
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
    items: [],
    totals: {
      subtotal: { amount: 25_000, currency: "IDR" },
      discount: { amount: 0, currency: "IDR" },
      tax: { amount: 0, currency: "IDR" },
      serviceCharge: { amount: 0, currency: "IDR" },
      rounding: { amount: 0, currency: "IDR" },
      total: { amount: 25_000, currency: "IDR" },
    },
    customerNote: "",
    internalNote: "",
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-20T08:05:00.000Z",
    events: [],
    ...patch,
  };
}

function createManualTransaction(): FinanceTransaction {
  return {
    id: "manual-1",
    occurredAt: "2026-07-20T07:00:00.000Z",
    direction: "outflow",
    type: "expense",
    source: "manual",
    status: "posted",
    categoryId: "ingredients",
    categoryLabel: "Bahan Baku",
    amount: { amount: 10_000, currency: "IDR" },
    paymentMethod: "cash",
    description: "Belanja bahan",
    referenceNumber: "EXP-001",
    sourceReference: null,
    attachment: null,
    createdAt: "2026-07-20T07:00:00.000Z",
    updatedAt: "2026-07-20T07:00:00.000Z",
  };
}

describe("finance order projection", () => {
  it("projects a paid new POS order as posted sale income", () => {
    expect(projectOrderToFinanceTransactions(createOrder())).toEqual([
      expect.objectContaining({
        id: "finance-order-order-1-sale",
        direction: "inflow",
        type: "sale",
        source: "automatic",
        status: "posted",
        referenceNumber: "WM-001",
        sourceReference: "order-1",
        amount: { amount: 25_000, currency: "IDR" },
      }),
    ]);
  });

  it("does not project an unpaid order", () => {
    expect(projectOrderToFinanceTransactions(createOrder({ paymentStatus: "unpaid" }))).toEqual([]);
  });

  it("projects a refunded order as sale plus refund with net zero", () => {
    const transactions = projectOrderToFinanceTransactions(
      createOrder({ paymentStatus: "refunded", status: "cancelled" }),
    );

    expect(transactions.map((transaction) => transaction.id)).toEqual([
      "finance-order-order-1-sale",
      "finance-order-order-1-refund",
    ]);
    expect(transactions[1]).toMatchObject({
      occurredAt: "2026-07-20T08:05:00.000Z",
      direction: "outflow",
      type: "refund",
      categoryId: "refund",
    });
    expect(summarizeFinanceTransactions(transactions).netCashflow.amount).toBe(0);
  });

  it("maps an unknown order payment method to other", () => {
    expect(
      projectOrderToFinanceTransactions(createOrder({ paymentMethod: "unknown" }))[0]
        ?.paymentMethod,
    ).toBe("other");
  });

  it("uses deterministic IDs and deduplicates repeated order projections", () => {
    const order = createOrder();
    const first = projectOrderToFinanceTransactions(order);
    const second = projectOrderToFinanceTransactions(order);

    expect(second).toEqual(first);
    expect(projectOrdersToFinanceTransactions([order, structuredClone(order)])).toHaveLength(1);
  });

  it("does not mutate source orders", () => {
    const order = createOrder({ paymentStatus: "refunded" });
    const snapshot = structuredClone(order);

    projectOrderToFinanceTransactions(order);

    expect(order).toEqual(snapshot);
  });

  it("merges cloned manual records with projected automatic records", () => {
    const manual = createManualTransaction();
    const ledger = buildFinanceLedger([createOrder()], [manual]);

    expect(ledger.map((transaction) => transaction.id)).toEqual([
      "manual-1",
      "finance-order-order-1-sale",
    ]);
    expect(ledger[0]).not.toBe(manual);
    expect(ledger[0]?.amount).not.toBe(manual.amount);
  });
});
