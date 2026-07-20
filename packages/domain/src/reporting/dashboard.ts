import type { Money } from "../catalog/types";
import type { FinanceTransaction } from "../finance/types";
import type { Order } from "../orders/types";
import type {
  DashboardSummary,
  DailySalesTrendPoint,
  LowStockIngredientItem,
  OrderChannelBreakdownItem,
  PaymentMethodBreakdownItem,
  ReportingPeriod,
  ReportingSnapshot,
} from "./types";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function money(amount: number): Money {
  return { amount, currency: "IDR" };
}

function roundPercentage(value: number): number {
  return Math.round(value * 100) / 100;
}

function assertDateKey(value: string): void {
  if (!DATE_KEY_PATTERN.test(value)) throw new RangeError(`Invalid reporting date: ${value}`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new RangeError(`Invalid reporting date: ${value}`);
  }
}

export function validateReportingPeriod(period: ReportingPeriod): void {
  assertDateKey(period.startDate);
  assertDateKey(period.endDate);
  if (period.startDate > period.endDate) {
    throw new RangeError("Reporting startDate must not be after endDate");
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: period.timeZone }).format(0);
  } catch {
    throw new RangeError(`Invalid reporting time zone: ${period.timeZone}`);
  }
}

export function getReportingDateKey(timestamp: string, timeZone: string): string | null {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : null;
}

export function getReportingHour(timestamp: string, timeZone: string): number | null {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return null;
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(parsed)
    .find((part) => part.type === "hour")?.value;
  return hour === undefined ? null : Number(hour);
}

export function isTimestampInReportingPeriod(timestamp: string, period: ReportingPeriod): boolean {
  validateReportingPeriod(period);
  const key = getReportingDateKey(timestamp, period.timeZone);
  return key !== null && key >= period.startDate && key <= period.endDate;
}

function enumerateDateKeys(period: ReportingPeriod): readonly string[] {
  validateReportingPeriod(period);
  const cursor = new Date(`${period.startDate}T00:00:00.000Z`);
  const last = new Date(`${period.endDate}T00:00:00.000Z`);
  const keys: string[] = [];
  while (cursor <= last) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function selectPeriodTransactions(snapshot: ReportingSnapshot): readonly FinanceTransaction[] {
  return snapshot.financeTransactions.filter((transaction) =>
    isTimestampInReportingPeriod(transaction.occurredAt, snapshot.period),
  );
}

function selectPeriodOrders(snapshot: ReportingSnapshot): readonly Order[] {
  return snapshot.orders.filter((order) =>
    isTimestampInReportingPeriod(order.createdAt, snapshot.period),
  );
}

function uniqueSaleReferences(transactions: readonly FinanceTransaction[]): readonly string[] {
  return Array.from(
    new Set(
      transactions
        .filter((transaction) => transaction.status === "posted" && transaction.type === "sale")
        .map((transaction) => transaction.sourceReference)
        .filter((reference): reference is string => reference !== null),
    ),
  );
}

export function selectLowStockIngredients(
  snapshot: ReportingSnapshot,
): readonly LowStockIngredientItem[] {
  const stockByIngredient = new Map<string, number>();
  snapshot.stockBalances.forEach((balance) => {
    stockByIngredient.set(
      balance.ingredientId,
      (stockByIngredient.get(balance.ingredientId) ?? 0) + balance.quantity,
    );
  });

  return snapshot.ingredients
    .filter((ingredient) => ingredient.status === "active")
    .flatMap((ingredient) => {
      const currentStock = stockByIngredient.get(ingredient.id);
      if (currentStock === undefined || currentStock > ingredient.minimumStock) return [];
      return [
        {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          unit: ingredient.baseUnit,
          currentStock,
          minimumStock: ingredient.minimumStock,
        },
      ];
    })
    .sort(
      (left, right) =>
        left.currentStock - right.currentStock ||
        left.ingredientName.localeCompare(right.ingredientName) ||
        left.ingredientId.localeCompare(right.ingredientId),
    );
}

export function calculateDashboardSummary(snapshot: ReportingSnapshot): DashboardSummary {
  const transactions = selectPeriodTransactions(snapshot);
  const posted = transactions.filter((transaction) => transaction.status === "posted");
  const grossSales = posted
    .filter((transaction) => transaction.type === "sale" && transaction.direction === "inflow")
    .reduce((total, transaction) => total + transaction.amount.amount, 0);
  const refunds = posted
    .filter((transaction) => transaction.type === "refund" && transaction.direction === "outflow")
    .reduce((total, transaction) => total + transaction.amount.amount, 0);
  const expenses = posted
    .filter((transaction) => transaction.type === "expense" && transaction.direction === "outflow")
    .reduce((total, transaction) => total + transaction.amount.amount, 0);
  const totalInflow = posted
    .filter((transaction) => transaction.direction === "inflow")
    .reduce((total, transaction) => total + transaction.amount.amount, 0);
  const totalOutflow = posted
    .filter((transaction) => transaction.direction === "outflow")
    .reduce((total, transaction) => total + transaction.amount.amount, 0);
  const saleReferences = uniqueSaleReferences(transactions);
  const paidOrderCount = saleReferences.length;
  const netRevenue = grossSales - refunds;
  const periodOrders = selectPeriodOrders(snapshot);
  const cancellationRate = periodOrders.length
    ? roundPercentage(
        (periodOrders.filter((order) => order.status === "cancelled").length /
          periodOrders.length) *
          100,
      )
    : 0;

  const orderById = new Map(snapshot.orders.map((order) => [order.id, order]));
  const hppByMenuId = new Map(snapshot.menuHpp.map((item) => [item.menuItemId, item.total.amount]));
  let estimatedCogs = 0;
  let missingCostItemCount = 0;
  saleReferences.forEach((reference) => {
    orderById.get(reference)?.items.forEach((item) => {
      const hpp = hppByMenuId.get(item.menuItemId);
      if (hpp === undefined) missingCostItemCount += 1;
      else estimatedCogs += hpp * item.quantity;
    });
  });
  const estimatedGrossProfit = netRevenue - estimatedCogs;
  const estimatedGrossMarginPercentage =
    netRevenue > 0 ? roundPercentage((estimatedGrossProfit / netRevenue) * 100) : 0;

  return {
    grossSales: money(grossSales),
    refunds: money(refunds),
    netRevenue: money(netRevenue),
    expenses: money(expenses),
    netCashflow: money(totalInflow - totalOutflow),
    paidOrderCount,
    averageOrderValue: money(paidOrderCount ? Math.round(netRevenue / paidOrderCount) : 0),
    cancellationRate,
    estimatedCogs: money(estimatedCogs),
    estimatedGrossProfit: money(estimatedGrossProfit),
    estimatedGrossMarginPercentage,
    missingCostItemCount,
    lowStockIngredientCount: selectLowStockIngredients(snapshot).length,
  };
}

export function buildDailySalesTrend(snapshot: ReportingSnapshot): readonly DailySalesTrendPoint[] {
  const buckets = new Map(
    enumerateDateKeys(snapshot.period).map((date) => [
      date,
      { grossSales: 0, refunds: 0, saleReferences: new Set<string>() },
    ]),
  );
  selectPeriodTransactions(snapshot).forEach((transaction) => {
    if (transaction.status !== "posted") return;
    const date = getReportingDateKey(transaction.occurredAt, snapshot.period.timeZone);
    const bucket = date ? buckets.get(date) : undefined;
    if (!bucket) return;
    if (transaction.type === "sale" && transaction.direction === "inflow") {
      bucket.grossSales += transaction.amount.amount;
      bucket.saleReferences.add(transaction.sourceReference ?? transaction.id);
    } else if (transaction.type === "refund" && transaction.direction === "outflow") {
      bucket.refunds += transaction.amount.amount;
    }
  });

  return Array.from(buckets, ([date, bucket]) => ({
    date,
    grossSales: money(bucket.grossSales),
    refunds: money(bucket.refunds),
    netRevenue: money(bucket.grossSales - bucket.refunds),
    paidOrderCount: bucket.saleReferences.size,
  }));
}

export function buildPaymentMethodBreakdown(
  snapshot: ReportingSnapshot,
): readonly PaymentMethodBreakdownItem[] {
  const groups = new Map<string, { inflow: number; outflow: number; count: number }>();
  selectPeriodTransactions(snapshot).forEach((transaction) => {
    if (transaction.status !== "posted") return;
    const current = groups.get(transaction.paymentMethod) ?? { inflow: 0, outflow: 0, count: 0 };
    if (transaction.direction === "inflow") current.inflow += transaction.amount.amount;
    else current.outflow += transaction.amount.amount;
    current.count += 1;
    groups.set(transaction.paymentMethod, current);
  });
  return Array.from(groups, ([paymentMethod, group]) => ({
    paymentMethod: paymentMethod as PaymentMethodBreakdownItem["paymentMethod"],
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

export function buildOrderChannelBreakdown(
  snapshot: ReportingSnapshot,
): readonly OrderChannelBreakdownItem[] {
  const orderById = new Map(snapshot.orders.map((order) => [order.id, order]));
  const groups = new Map<
    OrderChannelBreakdownItem["channel"],
    { sales: number; refunds: number; orderIds: Set<string> }
  >();
  selectPeriodTransactions(snapshot).forEach((transaction) => {
    if (transaction.status !== "posted" || transaction.sourceReference === null) return;
    const order = orderById.get(transaction.sourceReference);
    if (!order || (transaction.type !== "sale" && transaction.type !== "refund")) return;
    const current = groups.get(order.channel) ?? { sales: 0, refunds: 0, orderIds: new Set() };
    if (transaction.type === "sale" && transaction.direction === "inflow") {
      current.sales += transaction.amount.amount;
      current.orderIds.add(order.id);
    } else if (transaction.type === "refund" && transaction.direction === "outflow") {
      current.refunds += transaction.amount.amount;
    }
    groups.set(order.channel, current);
  });

  return Array.from(groups, ([channel, group]) => ({
    channel,
    paidOrderCount: group.orderIds.size,
    grossSales: money(group.sales),
    refunds: money(group.refunds),
    netRevenue: money(group.sales - group.refunds),
  })).sort(
    (left, right) =>
      right.netRevenue.amount - left.netRevenue.amount || left.channel.localeCompare(right.channel),
  );
}
