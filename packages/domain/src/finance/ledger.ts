import type { Order, OrderPaymentMethod } from "../orders/types";
import type { FinancePaymentMethod, FinanceTransaction, FinanceTransactionType } from "./types";

function mapPaymentMethod(method: OrderPaymentMethod): FinancePaymentMethod {
  return method === "unknown" ? "other" : method;
}

function buildAutomaticTransaction(
  order: Order,
  type: Extract<FinanceTransactionType, "sale" | "refund">,
): FinanceTransaction {
  const isRefund = type === "refund";
  const occurredAt = isRefund ? order.updatedAt : order.createdAt;

  return {
    id: `finance-order-${order.id}-${type}`,
    occurredAt,
    direction: isRefund ? "outflow" : "inflow",
    type,
    source: "automatic",
    status: "posted",
    categoryId: isRefund ? "refund" : "sales",
    categoryLabel: isRefund ? "Refund" : "Penjualan",
    amount: { ...order.totals.total },
    paymentMethod: mapPaymentMethod(order.paymentMethod),
    description: `${isRefund ? "Refund" : "Penjualan"} ${order.orderNumber}`,
    referenceNumber: order.orderNumber,
    sourceReference: order.id,
    attachment: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

export function projectOrderToFinanceTransactions(order: Order): readonly FinanceTransaction[] {
  if (order.paymentStatus === "unpaid") return [];

  const sale = buildAutomaticTransaction(order, "sale");
  if (order.paymentStatus === "paid") return [sale];

  return [sale, buildAutomaticTransaction(order, "refund")];
}

export function projectOrdersToFinanceTransactions(
  orders: readonly Order[],
): readonly FinanceTransaction[] {
  const projectedById = new Map<string, FinanceTransaction>();

  orders.forEach((order) => {
    projectOrderToFinanceTransactions(order).forEach((transaction) => {
      projectedById.set(transaction.id, transaction);
    });
  });

  return Array.from(projectedById.values());
}

export function buildFinanceLedger(
  orders: readonly Order[],
  manualTransactions: readonly FinanceTransaction[],
): readonly FinanceTransaction[] {
  const transactionById = new Map<string, FinanceTransaction>();

  manualTransactions.forEach((transaction) => {
    transactionById.set(transaction.id, structuredClone(transaction));
  });
  projectOrdersToFinanceTransactions(orders).forEach((transaction) => {
    transactionById.set(transaction.id, transaction);
  });

  return Array.from(transactionById.values());
}
