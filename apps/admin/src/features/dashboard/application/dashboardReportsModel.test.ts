import {
  buildCategoryPerformance,
  buildDailySalesTrend,
  buildInventoryUsage,
  buildMenuPerformance,
  buildOrderChannelBreakdown,
  buildPaymentMethodBreakdown,
  buildPeakSalesHours,
  calculateDashboardSummary,
  type FinanceTransaction,
  type ReportingSnapshot,
} from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import {
  compareDailySalesByDate,
  compareInventoryUsageByQuantity,
  compareMenuPerformanceByQuantity,
  createDashboardReportsModel,
} from "./dashboardReportsModel";

function emptySnapshot(): ReportingSnapshot {
  return {
    period: { startDate: "2026-07-19", endDate: "2026-07-20", timeZone: "Asia/Jakarta" },
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

describe("dashboard reports model", () => {
  it("maps every report section directly from established domain selectors", () => {
    const snapshot = emptySnapshot();
    const model = createDashboardReportsModel(snapshot);

    expect(model.dailySalesTrend).toEqual(buildDailySalesTrend(snapshot));
    expect(model.paymentMethods).toEqual(buildPaymentMethodBreakdown(snapshot));
    expect(model.orderChannels).toEqual(buildOrderChannelBreakdown(snapshot));
    expect(model.peakSalesHours).toEqual(buildPeakSalesHours(snapshot));
    expect(model.menuPerformance).toEqual(buildMenuPerformance(snapshot));
    expect(model.categoryPerformance).toEqual(buildCategoryPerformance(snapshot));
    expect(model.inventoryUsage).toEqual(buildInventoryUsage(snapshot));
    expect(model.dailyNetRevenueTotal).toBe(0);
    expect(model.isSalesEmpty).toBe(true);
    expect(model.isMenuEmpty).toBe(true);
    expect(model.isInventoryEmpty).toBe(true);
  });

  it("keeps the daily net-revenue total equal to the dashboard summary", () => {
    const sale: FinanceTransaction = {
      id: "sale-1",
      occurredAt: "2026-07-20T03:00:00.000Z",
      direction: "inflow",
      type: "sale",
      source: "automatic",
      status: "posted",
      categoryId: "sales",
      categoryLabel: "Penjualan",
      amount: { amount: 25_000, currency: "IDR" },
      paymentMethod: "cash",
      description: "Sale",
      referenceNumber: "order-1",
      sourceReference: "order-1",
      attachment: null,
      createdAt: "2026-07-20T03:00:00.000Z",
      updatedAt: "2026-07-20T03:00:00.000Z",
    };
    const snapshot = { ...emptySnapshot(), financeTransactions: [sale] };

    expect(createDashboardReportsModel(snapshot).dailyNetRevenueTotal).toBe(
      calculateDashboardSummary(snapshot).netRevenue.amount,
    );
  });

  it("uses deterministic tie-breakers without mutating report rows", () => {
    const daily = [
      {
        date: "2026-07-20",
        grossSales: { amount: 0, currency: "IDR" as const },
        refunds: { amount: 0, currency: "IDR" as const },
        netRevenue: { amount: 0, currency: "IDR" as const },
        paidOrderCount: 0,
      },
      {
        date: "2026-07-19",
        grossSales: { amount: 0, currency: "IDR" as const },
        refunds: { amount: 0, currency: "IDR" as const },
        netRevenue: { amount: 0, currency: "IDR" as const },
        paidOrderCount: 0,
      },
    ];
    const sorted = [...daily].sort(compareDailySalesByDate);

    expect(sorted.map((row) => row.date)).toEqual(["2026-07-19", "2026-07-20"]);
    expect(daily[0]?.date).toBe("2026-07-20");
  });

  it("sorts menu and inventory quantity ties by stable names and IDs", () => {
    const money = { amount: 10_000, currency: "IDR" as const };
    const menus = [
      {
        menuItemId: "b",
        menuName: "Bakso",
        categoryId: null,
        categoryName: null,
        quantitySold: 1,
        netSales: money,
        estimatedCogs: money,
        estimatedGrossProfit: money,
        estimatedGrossMarginPercentage: 0,
        missingCost: false,
      },
      {
        menuItemId: "a",
        menuName: "Ayam",
        categoryId: null,
        categoryName: null,
        quantitySold: 1,
        netSales: money,
        estimatedCogs: money,
        estimatedGrossProfit: money,
        estimatedGrossMarginPercentage: 0,
        missingCost: false,
      },
    ];
    const inventory = [
      {
        ingredientId: "b",
        ingredientName: "Beras",
        unit: "kg" as const,
        quantityUsed: 1,
        estimatedUsageValue: money,
        currentStock: 1,
        minimumStock: 1,
        lowStock: true,
      },
      {
        ingredientId: "a",
        ingredientName: "Ayam",
        unit: "kg" as const,
        quantityUsed: 1,
        estimatedUsageValue: money,
        currentStock: 1,
        minimumStock: 1,
        lowStock: true,
      },
    ];

    expect([...menus].sort(compareMenuPerformanceByQuantity).map((row) => row.menuItemId)).toEqual([
      "a",
      "b",
    ]);
    expect(
      [...inventory].sort(compareInventoryUsageByQuantity).map((row) => row.ingredientId),
    ).toEqual(["a", "b"]);
  });
});
