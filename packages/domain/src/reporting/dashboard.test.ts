import { describe, expect, it } from "vitest";
import type { Money, MenuItem } from "../catalog/types";
import type { FinanceTransaction } from "../finance/types";
import type {
  InventoryIngredient,
  InventoryStockBalance,
  MenuHppBreakdown,
} from "../inventory/types";
import type { Order, OrderItem } from "../orders/types";
import {
  buildDailySalesTrend,
  calculateDashboardSummary,
  selectLowStockIngredients,
  validateReportingPeriod,
} from "./dashboard";
import type { ReportingSnapshot } from "./types";

const idr = (amount: number): Money => ({ amount, currency: "IDR" });

function createOrderItem(patch: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "line-1",
    menuItemId: "menu-1",
    name: "Gado-gado",
    quantity: 1,
    unitPrice: idr(20_000),
    variantSelections: [],
    note: "",
    lineTotal: idr(20_000),
    ...patch,
  };
}

function createOrder(patch: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    orderNumber: "WM-001",
    outletId: "wm-1",
    outletName: "Warung Meng",
    channel: "pos",
    fulfillment: "dine-in",
    paymentStatus: "paid",
    paymentMethod: "cash",
    status: "completed",
    customer: null,
    items: [createOrderItem()],
    totals: {
      subtotal: idr(20_000),
      discount: idr(0),
      tax: idr(0),
      serviceCharge: idr(0),
      rounding: idr(0),
      total: idr(20_000),
    },
    customerNote: "",
    internalNote: "",
    createdAt: "2026-07-20T03:00:00.000Z",
    updatedAt: "2026-07-20T03:05:00.000Z",
    events: [],
    ...patch,
  };
}

function createTransaction(patch: Partial<FinanceTransaction> = {}): FinanceTransaction {
  return {
    id: "sale-1",
    occurredAt: "2026-07-20T03:00:00.000Z",
    direction: "inflow",
    type: "sale",
    source: "automatic",
    status: "posted",
    categoryId: "sales",
    categoryLabel: "Penjualan",
    amount: idr(20_000),
    paymentMethod: "cash",
    description: "Penjualan WM-001",
    referenceNumber: "WM-001",
    sourceReference: "order-1",
    attachment: null,
    createdAt: "2026-07-20T03:00:00.000Z",
    updatedAt: "2026-07-20T03:00:00.000Z",
    ...patch,
  };
}

function createMenuItem(): MenuItem {
  return {
    id: "menu-1",
    name: "Gado-gado",
    slug: "gado-gado",
    categoryId: "food",
    description: "",
    image: null,
    price: idr(20_000),
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds: [],
    sortOrder: 1,
  };
}

function createSnapshot(patch: Partial<ReportingSnapshot> = {}): ReportingSnapshot {
  return {
    period: { startDate: "2026-07-20", endDate: "2026-07-20", timeZone: "Asia/Jakarta" },
    orders: [createOrder()],
    financeTransactions: [createTransaction()],
    menuItems: [createMenuItem()],
    categories: [
      { id: "food", name: "Makanan", slug: "makanan", visibility: "visible", sortOrder: 1 },
    ],
    menuHpp: [],
    ingredients: [],
    stockBalances: [],
    inventoryMovements: [],
    ...patch,
  };
}

describe("dashboard reporting selectors", () => {
  it("separates gross sales from manual inflow while including both in cashflow", () => {
    const manualIncome = createTransaction({
      id: "manual-income",
      type: "manual-income",
      source: "manual",
      sourceReference: null,
      amount: idr(5_000),
    });
    const summary = calculateDashboardSummary(
      createSnapshot({ financeTransactions: [createTransaction(), manualIncome] }),
    );

    expect(summary.grossSales.amount).toBe(20_000);
    expect(summary.netRevenue.amount).toBe(20_000);
    expect(summary.netCashflow.amount).toBe(25_000);
  });

  it("subtracts posted refunds from net revenue exactly once", () => {
    const refund = createTransaction({
      id: "refund-1",
      direction: "outflow",
      type: "refund",
      amount: idr(20_000),
    });
    const summary = calculateDashboardSummary(
      createSnapshot({ financeTransactions: [createTransaction(), refund] }),
    );

    expect(summary.grossSales.amount).toBe(20_000);
    expect(summary.refunds.amount).toBe(20_000);
    expect(summary.netRevenue.amount).toBe(0);
  });

  it("keeps operating expenses separate from other cash outflow", () => {
    const expense = createTransaction({
      id: "expense-1",
      direction: "outflow",
      type: "expense",
      source: "manual",
      sourceReference: null,
      amount: idr(4_000),
    });
    const cashOut = createTransaction({
      id: "cash-out-1",
      direction: "outflow",
      type: "cash-out",
      source: "manual",
      sourceReference: null,
      amount: idr(1_000),
    });
    const summary = calculateDashboardSummary(
      createSnapshot({ financeTransactions: [createTransaction(), expense, cashOut] }),
    );

    expect(summary.expenses.amount).toBe(4_000);
    expect(summary.netCashflow.amount).toBe(15_000);
  });

  it("calculates AOV from unique paid orders and returns zero for an empty denominator", () => {
    const secondSale = createTransaction({
      id: "sale-2",
      sourceReference: "order-2",
      amount: idr(10_000),
    });
    expect(
      calculateDashboardSummary(
        createSnapshot({ financeTransactions: [createTransaction(), secondSale] }),
      ).averageOrderValue.amount,
    ).toBe(15_000);
    expect(
      calculateDashboardSummary(createSnapshot({ orders: [], financeTransactions: [] }))
        .averageOrderValue.amount,
    ).toBe(0);
  });

  it("calculates cancellation rate from orders created in the period", () => {
    const cancelled = createOrder({ id: "order-2", status: "cancelled" });
    const outside = createOrder({
      id: "order-3",
      status: "cancelled",
      createdAt: "2026-07-18T03:00:00.000Z",
    });
    expect(
      calculateDashboardSummary(createSnapshot({ orders: [createOrder(), cancelled, outside] }))
        .cancellationRate,
    ).toBe(50);
  });

  it("reports missing HPP instead of using the menu price as fallback", () => {
    const missing = calculateDashboardSummary(createSnapshot());
    const hpp: MenuHppBreakdown = {
      menuItemId: "menu-1",
      ingredientCosts: [],
      ingredientTotal: idr(6_000),
      packagingCost: idr(1_000),
      additionalCost: idr(0),
      total: idr(7_000),
    };
    const known = calculateDashboardSummary(createSnapshot({ menuHpp: [hpp] }));

    expect(missing.missingCostItemCount).toBe(1);
    expect(missing.estimatedCogs.amount).toBe(0);
    expect(known.missingCostItemCount).toBe(0);
    expect(known.estimatedCogs.amount).toBe(7_000);
  });

  it("treats active stock exactly at minimum as low stock", () => {
    const ingredient: InventoryIngredient = {
      id: "rice",
      name: "Beras",
      baseUnit: "g",
      supplierId: null,
      status: "active",
      minimumStock: 1_000,
      lastPurchaseUnitCost: idr(0.02),
      averageUnitCost: idr(0.02),
    };
    const balance: InventoryStockBalance = {
      ingredientId: "rice",
      outletId: "wm-1",
      quantity: 1_000,
      updatedAt: "2026-07-20T00:00:00.000Z",
    };

    expect(
      selectLowStockIngredients(
        createSnapshot({ ingredients: [ingredient], stockBalances: [balance] }),
      ),
    ).toEqual([
      expect.objectContaining({ ingredientId: "rice", currentStock: 1_000, minimumStock: 1_000 }),
    ]);
  });

  it("fills empty dates in a daily sales trend", () => {
    const trend = buildDailySalesTrend(
      createSnapshot({
        period: { startDate: "2026-07-19", endDate: "2026-07-21", timeZone: "Asia/Jakarta" },
      }),
    );

    expect(trend.map((point) => [point.date, point.netRevenue.amount])).toEqual([
      ["2026-07-19", 0],
      ["2026-07-20", 20_000],
      ["2026-07-21", 0],
    ]);
  });

  it("uses WIB local-day boundaries instead of UTC calendar dates", () => {
    const localMidnightSale = createTransaction({ occurredAt: "2026-07-19T17:30:00.000Z" });
    const nextLocalDaySale = createTransaction({
      id: "sale-next-day",
      occurredAt: "2026-07-20T17:00:00.000Z",
      sourceReference: "order-2",
    });
    const summary = calculateDashboardSummary(
      createSnapshot({ financeTransactions: [localMidnightSale, nextLocalDaySale] }),
    );

    expect(summary.grossSales.amount).toBe(20_000);
    expect(summary.paidOrderCount).toBe(1);
  });

  it("rejects reversed or invalid reporting periods", () => {
    expect(() =>
      validateReportingPeriod({
        startDate: "2026-07-21",
        endDate: "2026-07-20",
        timeZone: "Asia/Jakarta",
      }),
    ).toThrow(RangeError);
    expect(() =>
      validateReportingPeriod({
        startDate: "2026-02-30",
        endDate: "2026-03-01",
        timeZone: "Asia/Jakarta",
      }),
    ).toThrow(RangeError);
  });

  it("does not mutate reporting inputs", () => {
    const snapshot = createSnapshot();
    const original = structuredClone(snapshot);

    calculateDashboardSummary(snapshot);
    buildDailySalesTrend(snapshot);
    selectLowStockIngredients(snapshot);

    expect(snapshot).toEqual(original);
  });
});
