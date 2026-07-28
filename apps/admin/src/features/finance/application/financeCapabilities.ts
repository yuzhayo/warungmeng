import type { FinanceRepository, OrderListQuery } from "@warungmeng/data";
import type { FinanceTransaction, FinanceTransactionQuery, Order } from "@warungmeng/domain";

/**
 * Read surface published as `finance.read`. Order-derived ledger sources come
 * through the injected order read port — Finance never imports the Orders
 * repository.
 */
export interface FinanceReadCapability {
  listOrders(query?: OrderListQuery): Promise<readonly Order[]>;
  listManualTransactions(query?: FinanceTransactionQuery): Promise<readonly FinanceTransaction[]>;
}

/** Manual-transaction mutation surface published as `finance.record`. */
export type FinanceRecordCapability = Pick<
  FinanceRepository,
  "createManualTransaction" | "updateManualTransaction" | "voidManualTransaction"
>;

/**
 * Refund surface published as `finance.refund`: a deterministic projection of
 * a settled order — never a persisted refund write.
 */
export interface FinanceRefundCapability {
  projectRefund(order: Order): readonly FinanceTransaction[];
}
