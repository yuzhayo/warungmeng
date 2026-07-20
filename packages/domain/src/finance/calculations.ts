import type {
  FinanceCategorySummary,
  FinancePaymentMethod,
  FinancePaymentMethodSummary,
  FinanceSummary,
  FinanceTransaction,
  FinanceTransactionQuery,
} from "./types";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function money(amount: number) {
  return { amount, currency: "IDR" as const };
}

function parseBoundary(value: string, boundary: "start" | "end"): number {
  const normalized = DATE_ONLY_PATTERN.test(value)
    ? `${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}Z`
    : value;
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) throw new RangeError(`Invalid finance date boundary: ${value}`);
  return timestamp;
}

function includesSearch(transaction: FinanceTransaction, search: string): boolean {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  if (!normalizedSearch) return true;

  return [
    transaction.description,
    transaction.referenceNumber,
    transaction.categoryLabel,
    transaction.sourceReference ?? "",
  ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
}

export function sortFinanceTransactionsNewestFirst(
  transactions: readonly FinanceTransaction[],
): readonly FinanceTransaction[] {
  return [...transactions].sort(
    (left, right) =>
      right.occurredAt.localeCompare(left.occurredAt) || left.id.localeCompare(right.id),
  );
}

export function filterFinanceTransactions(
  transactions: readonly FinanceTransaction[],
  query: FinanceTransactionQuery = {},
): readonly FinanceTransaction[] {
  const dateFrom = query.dateFrom ? parseBoundary(query.dateFrom, "start") : null;
  const dateTo = query.dateTo ? parseBoundary(query.dateTo, "end") : null;
  if (dateFrom !== null && dateTo !== null && dateFrom > dateTo) {
    throw new RangeError("Finance dateFrom must not be after dateTo");
  }

  return sortFinanceTransactionsNewestFirst(
    transactions.filter((transaction) => {
      const occurredAt = Date.parse(transaction.occurredAt);
      return (
        Number.isFinite(occurredAt) &&
        (dateFrom === null || occurredAt >= dateFrom) &&
        (dateTo === null || occurredAt <= dateTo) &&
        (!query.search || includesSearch(transaction, query.search)) &&
        (!query.direction || transaction.direction === query.direction) &&
        (!query.type || transaction.type === query.type) &&
        (!query.categoryId || transaction.categoryId === query.categoryId) &&
        (!query.paymentMethod || transaction.paymentMethod === query.paymentMethod) &&
        (!query.source || transaction.source === query.source) &&
        (!query.status || transaction.status === query.status)
      );
    }),
  );
}

export function summarizeFinanceTransactions(
  transactions: readonly FinanceTransaction[],
): FinanceSummary {
  let inflow = 0;
  let outflow = 0;
  let cashInflow = 0;
  let cashOutflow = 0;
  let postedCount = 0;
  let pendingCount = 0;
  let voidedCount = 0;

  transactions.forEach((transaction) => {
    if (transaction.status === "pending") {
      pendingCount += 1;
      return;
    }
    if (transaction.status === "voided") {
      voidedCount += 1;
      return;
    }

    postedCount += 1;
    if (transaction.direction === "inflow") {
      inflow += transaction.amount.amount;
      if (transaction.paymentMethod === "cash") cashInflow += transaction.amount.amount;
    } else {
      outflow += transaction.amount.amount;
      if (transaction.paymentMethod === "cash") cashOutflow += transaction.amount.amount;
    }
  });

  return {
    totalInflow: money(inflow),
    totalOutflow: money(outflow),
    netCashflow: money(inflow - outflow),
    cashBalance: money(cashInflow - cashOutflow),
    postedCount,
    pendingCount,
    voidedCount,
  };
}

export function groupFinanceTransactionsByPaymentMethod(
  transactions: readonly FinanceTransaction[],
): readonly FinancePaymentMethodSummary[] {
  const groups = new Map<
    FinancePaymentMethod,
    { inflow: number; outflow: number; count: number }
  >();

  transactions.forEach((transaction) => {
    if (transaction.status !== "posted") return;
    const current = groups.get(transaction.paymentMethod) ?? { inflow: 0, outflow: 0, count: 0 };
    if (transaction.direction === "inflow") current.inflow += transaction.amount.amount;
    else current.outflow += transaction.amount.amount;
    current.count += 1;
    groups.set(transaction.paymentMethod, current);
  });

  return Array.from(groups, ([paymentMethod, group]) => ({
    paymentMethod,
    totalInflow: money(group.inflow),
    totalOutflow: money(group.outflow),
    netCashflow: money(group.inflow - group.outflow),
    transactionCount: group.count,
  })).sort(
    (left, right) =>
      right.netCashflow.amount - left.netCashflow.amount ||
      left.paymentMethod.localeCompare(right.paymentMethod),
  );
}

export function groupFinanceOutflowsByCategory(
  transactions: readonly FinanceTransaction[],
): readonly FinanceCategorySummary[] {
  const groups = new Map<string, { label: string; total: number; count: number }>();

  transactions.forEach((transaction) => {
    if (transaction.status !== "posted" || transaction.direction !== "outflow") return;
    const current = groups.get(transaction.categoryId) ?? {
      label: transaction.categoryLabel,
      total: 0,
      count: 0,
    };
    current.total += transaction.amount.amount;
    current.count += 1;
    groups.set(transaction.categoryId, current);
  });

  return Array.from(groups, ([categoryId, group]) => ({
    categoryId,
    categoryLabel: group.label,
    total: money(group.total),
    transactionCount: group.count,
  })).sort(
    (left, right) =>
      right.total.amount - left.total.amount ||
      left.categoryLabel.localeCompare(right.categoryLabel),
  );
}
