import type { FinanceTransaction, Order } from "@warungmeng/domain";

/**
 * Narrow finance port for cancellation. Refund behavior is derived from the
 * settled order exactly as the finance ledger projects it — no new
 * persistence API. Returns the refund transactions a cancellation settles
 * (empty when the order carries no refund, e.g. an unpaid cancellation).
 * Composition satisfies this with the finance module's refund capability.
 */
export interface FinanceRefundPort {
  projectRefund(order: Order): readonly FinanceTransaction[];
}
