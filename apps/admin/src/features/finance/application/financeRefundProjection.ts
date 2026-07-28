import {
  projectOrderToFinanceTransactions,
  type FinanceTransaction,
  type Order,
} from "@warungmeng/domain";

/**
 * Canonical refund projection the finance ledger derives from a settled
 * order. Deterministic — the same settled order always yields the same refund
 * transactions and references — so exactly-once refund semantics come from
 * order state, not from a persisted refund write.
 */
export function projectOrderRefund(order: Order): readonly FinanceTransaction[] {
  return projectOrderToFinanceTransactions(order).filter(
    (transaction) => transaction.type === "refund",
  );
}
