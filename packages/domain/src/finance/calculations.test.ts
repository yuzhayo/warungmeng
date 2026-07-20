import { describe, expect, it } from "vitest";
import {
  filterFinanceTransactions,
  groupFinanceOutflowsByCategory,
  groupFinanceTransactionsByPaymentMethod,
  sortFinanceTransactionsNewestFirst,
  summarizeFinanceTransactions,
} from "./calculations";
import type { FinanceTransaction } from "./types";

function createTransaction(
  id: string,
  patch: Partial<FinanceTransaction> = {},
): FinanceTransaction {
  return {
    id,
    occurredAt: "2026-07-20T08:00:00.000Z",
    direction: "inflow",
    type: "sale",
    source: "automatic",
    status: "posted",
    categoryId: "sales",
    categoryLabel: "Penjualan",
    amount: { amount: 10_000, currency: "IDR" },
    paymentMethod: "cash",
    description: `Penjualan ${id}`,
    referenceNumber: id.toUpperCase(),
    sourceReference: `order-${id}`,
    attachment: null,
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-20T08:00:00.000Z",
    ...patch,
  };
}

describe("finance calculations", () => {
  it("summarizes posted inflow, outflow, net cashflow, and cash balance", () => {
    const summary = summarizeFinanceTransactions([
      createTransaction("sale", { amount: { amount: 50_000, currency: "IDR" } }),
      createTransaction("qris", {
        amount: { amount: 20_000, currency: "IDR" },
        paymentMethod: "qris",
      }),
      createTransaction("expense", {
        direction: "outflow",
        type: "expense",
        source: "manual",
        categoryId: "ingredients",
        categoryLabel: "Bahan Baku",
        amount: { amount: 15_000, currency: "IDR" },
      }),
    ]);

    expect(summary).toMatchObject({
      totalInflow: { amount: 70_000, currency: "IDR" },
      totalOutflow: { amount: 15_000, currency: "IDR" },
      netCashflow: { amount: 55_000, currency: "IDR" },
      cashBalance: { amount: 35_000, currency: "IDR" },
      postedCount: 3,
    });
  });

  it("excludes pending and voided values while counting their statuses", () => {
    const summary = summarizeFinanceTransactions([
      createTransaction("posted"),
      createTransaction("pending", {
        status: "pending",
        amount: { amount: 99_000, currency: "IDR" },
      }),
      createTransaction("voided", {
        status: "voided",
        amount: { amount: 99_000, currency: "IDR" },
      }),
    ]);

    expect(summary.totalInflow.amount).toBe(10_000);
    expect(summary).toMatchObject({ postedCount: 1, pendingCount: 1, voidedCount: 1 });
  });

  it("filters inclusive date-only boundaries and sorts newest first", () => {
    const result = filterFinanceTransactions(
      [
        createTransaction("before", { occurredAt: "2026-07-19T23:59:59.999Z" }),
        createTransaction("start", { occurredAt: "2026-07-20T00:00:00.000Z" }),
        createTransaction("end", { occurredAt: "2026-07-20T23:59:59.999Z" }),
        createTransaction("after", { occurredAt: "2026-07-21T00:00:00.000Z" }),
      ],
      { dateFrom: "2026-07-20", dateTo: "2026-07-20" },
    );

    expect(result.map((transaction) => transaction.id)).toEqual(["end", "start"]);
  });

  it("filters every supported structured field", () => {
    const target = createTransaction("target", {
      direction: "outflow",
      type: "expense",
      source: "manual",
      status: "pending",
      categoryId: "utilities",
      categoryLabel: "Listrik dan Utilitas",
      paymentMethod: "bank-transfer",
    });
    const result = filterFinanceTransactions([createTransaction("other"), target], {
      direction: "outflow",
      type: "expense",
      source: "manual",
      status: "pending",
      categoryId: "utilities",
      paymentMethod: "bank-transfer",
    });

    expect(result).toEqual([target]);
  });

  it("searches description, reference, category, and source reference case-insensitively", () => {
    const transaction = createTransaction("target", {
      description: "Bayar Gas Dapur",
      referenceNumber: "REF-ABC",
      categoryLabel: "UTILITAS KHUSUS",
      sourceReference: "order-special",
    });

    expect(filterFinanceTransactions([transaction], { search: " gas " })).toHaveLength(1);
    expect(filterFinanceTransactions([transaction], { search: "ref-abc" })).toHaveLength(1);
    expect(filterFinanceTransactions([transaction], { search: "utilitas" })).toHaveLength(1);
    expect(filterFinanceTransactions([transaction], { search: "ORDER-SPECIAL" })).toHaveLength(1);
  });

  it("rejects invalid and reversed date boundaries", () => {
    expect(() => filterFinanceTransactions([], { dateFrom: "invalid" })).toThrow(RangeError);
    expect(() =>
      filterFinanceTransactions([], { dateFrom: "2026-07-21", dateTo: "2026-07-20" }),
    ).toThrow(RangeError);
  });

  it("groups posted transactions by payment method", () => {
    const groups = groupFinanceTransactionsByPaymentMethod([
      createTransaction("sale"),
      createTransaction("expense", {
        direction: "outflow",
        type: "expense",
        source: "manual",
        amount: { amount: 4_000, currency: "IDR" },
      }),
      createTransaction("pending", { status: "pending", paymentMethod: "qris" }),
    ]);

    expect(groups).toEqual([
      {
        paymentMethod: "cash",
        totalInflow: { amount: 10_000, currency: "IDR" },
        totalOutflow: { amount: 4_000, currency: "IDR" },
        netCashflow: { amount: 6_000, currency: "IDR" },
        transactionCount: 2,
      },
    ]);
  });

  it("groups posted outflows by category and ranks the largest first", () => {
    const groups = groupFinanceOutflowsByCategory([
      createTransaction("ingredients-a", {
        direction: "outflow",
        type: "expense",
        categoryId: "ingredients",
        categoryLabel: "Bahan Baku",
        amount: { amount: 5_000, currency: "IDR" },
      }),
      createTransaction("ingredients-b", {
        direction: "outflow",
        type: "expense",
        categoryId: "ingredients",
        categoryLabel: "Bahan Baku",
        amount: { amount: 7_000, currency: "IDR" },
      }),
      createTransaction("utilities", {
        direction: "outflow",
        type: "expense",
        categoryId: "utilities",
        categoryLabel: "Utilitas",
        amount: { amount: 2_000, currency: "IDR" },
      }),
      createTransaction("ignored", { direction: "outflow", type: "expense", status: "voided" }),
    ]);

    expect(groups).toEqual([
      {
        categoryId: "ingredients",
        categoryLabel: "Bahan Baku",
        total: { amount: 12_000, currency: "IDR" },
        transactionCount: 2,
      },
      {
        categoryId: "utilities",
        categoryLabel: "Utilitas",
        total: { amount: 2_000, currency: "IDR" },
        transactionCount: 1,
      },
    ]);
  });

  it("sorts ties by ID and never mutates the source array", () => {
    const source = [createTransaction("z"), createTransaction("a")];
    const snapshot = structuredClone(source);

    expect(sortFinanceTransactionsNewestFirst(source).map((transaction) => transaction.id)).toEqual(
      ["a", "z"],
    );
    expect(source).toEqual(snapshot);
  });
});
