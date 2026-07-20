import {
  buildDailySalesTrend,
  buildOrderChannelBreakdown,
  buildPaymentMethodBreakdown,
  calculateDashboardSummary,
  selectLowStockIngredients,
  type ReportingSnapshot,
} from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import { createDashboardOverviewModel } from "./dashboardOverviewModel";

function emptySnapshot(): ReportingSnapshot {
  return {
    period: {
      startDate: "2026-07-20",
      endDate: "2026-07-20",
      timeZone: "Asia/Jakarta",
    },
    orders: [],
    financeTransactions: [],
    menuItems: [],
    categories: [],
    menuHpp: [],
    ingredients: [],
    stockBalances: [],
    inventoryMovements: [],
  };
}

describe("dashboard overview model", () => {
  it("maps every overview section directly from the reporting domain selectors", () => {
    const snapshot = emptySnapshot();
    const model = createDashboardOverviewModel(snapshot);

    expect(model.summary).toEqual(calculateDashboardSummary(snapshot));
    expect(model.dailySalesTrend).toEqual(buildDailySalesTrend(snapshot));
    expect(model.paymentMethods).toEqual(buildPaymentMethodBreakdown(snapshot));
    expect(model.orderChannels).toEqual(buildOrderChannelBreakdown(snapshot));
    expect(model.lowStockIngredients).toEqual(selectLowStockIngredients(snapshot));
  });

  it("marks a snapshot without finance, order, or stock activity as empty", () => {
    expect(createDashboardOverviewModel(emptySnapshot()).isEmpty).toBe(true);
  });

  it("does not mark a low-stock-only snapshot as empty", () => {
    const snapshot: ReportingSnapshot = {
      ...emptySnapshot(),
      ingredients: [
        {
          id: "ingredient-1",
          name: "Beras",
          baseUnit: "kg",
          supplierId: null,
          status: "active",
          minimumStock: 2,
          lastPurchaseUnitCost: { amount: 15_000, currency: "IDR" },
          averageUnitCost: { amount: 14_000, currency: "IDR" },
        },
      ],
      stockBalances: [
        { ingredientId: "ingredient-1", outletId: "wm-1", quantity: 1, updatedAt: "2026-07-20" },
      ],
    };

    expect(createDashboardOverviewModel(snapshot).isEmpty).toBe(false);
  });
});
