import { WARUNG_MENG_FINANCE_FIXTURES } from "@warungmeng/data";
import type { FinanceTransaction } from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import { buildFinanceOverviewViewModel } from "./useFinanceOverview";

function createAutomaticSale(): FinanceTransaction {
  return {
    id: "finance-order-order-test-sale",
    occurredAt: "2026-07-20T08:00:00.000Z",
    direction: "inflow",
    type: "sale",
    source: "automatic",
    status: "posted",
    categoryId: "sales",
    categoryLabel: "Penjualan",
    amount: { amount: 50_000, currency: "IDR" },
    paymentMethod: "qris",
    description: "Penjualan WM-TEST",
    referenceNumber: "WM-TEST",
    sourceReference: "order-test",
    attachment: null,
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-20T08:00:00.000Z",
  };
}

describe("finance overview view model", () => {
  it("derives filtered totals, breakdowns, and five most recent records without mutation", () => {
    const source = [...WARUNG_MENG_FINANCE_FIXTURES, createAutomaticSale()];
    const snapshot = structuredClone(source);
    const viewModel = buildFinanceOverviewViewModel(source, {
      dateFrom: "2026-07-18",
      dateTo: "2026-07-20",
    });

    expect(viewModel.transactions).toHaveLength(5);
    expect(viewModel.recentTransactions).toHaveLength(5);
    expect(viewModel.summary).toMatchObject({
      totalInflow: { amount: 550_000, currency: "IDR" },
      totalOutflow: { amount: 207_000, currency: "IDR" },
      netCashflow: { amount: 343_000, currency: "IDR" },
      pendingCount: 1,
    });
    expect(viewModel.paymentMethods.map((group) => group.paymentMethod)).toEqual(["cash", "qris"]);
    expect(viewModel.expenseCategories[0]).toMatchObject({
      categoryId: "ingredients",
      total: { amount: 185_000, currency: "IDR" },
    });
    expect(
      viewModel.expenseCategories.reduce((total, category) => total + category.total.amount, 0),
    ).toBe(viewModel.summary.totalOutflow.amount);
    expect(source).toEqual(snapshot);
  });

  it("keeps an expense query restricted to valid outflows", () => {
    const viewModel = buildFinanceOverviewViewModel(
      [...WARUNG_MENG_FINANCE_FIXTURES, createAutomaticSale()],
      { direction: "outflow" },
    );

    expect(viewModel.transactions.length).toBeGreaterThan(0);
    expect(viewModel.transactions.every((transaction) => transaction.direction === "outflow")).toBe(
      true,
    );
    expect(viewModel.summary.totalInflow.amount).toBe(0);
  });
});
