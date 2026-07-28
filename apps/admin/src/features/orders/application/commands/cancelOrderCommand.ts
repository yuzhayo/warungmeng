import type { AtomicDataTransaction } from "@warungmeng/data";
import type { Order } from "@warungmeng/domain";
import type { FinanceRefundPort } from "../ports/financeRefundPort";
import type { InventoryReversalPort } from "../ports/inventoryReversalPort";
import type { OrderCancellationPort } from "../ports/orderRepositoryPort";

export interface CancelOrderPorts {
  readonly orders: OrderCancellationPort;
  readonly inventory: InventoryReversalPort;
  readonly finance: FinanceRefundPort;
  readonly transaction: AtomicDataTransaction;
}

export type CancelOrderOutcome =
  | { readonly status: "cancelled"; readonly order: Order; readonly refunded: boolean }
  | { readonly status: "not-found" }
  | { readonly status: "invalid-transition"; readonly order: Order }
  | {
      readonly status: "failed";
      readonly reason: "inventory-reversal" | "transaction";
      readonly retryable: true;
      readonly dataChanged: false;
    };

class InventoryReversalError extends Error {
  constructor(cause: unknown) {
    super("Inventory reversal failed during order cancellation", { cause });
    this.name = "InventoryReversalError";
  }
}

/**
 * Cancels an order atomically. A paid cancellation commits the
 * cancelled/refunded order together with exactly one inventory reversal, or
 * commits nothing: any failure inside the transaction rolls every targeted
 * mutation back and reports `failed` with `dataChanged: false`, so a
 * cancelled/refunded order with a missing reversal can never exist. Unpaid
 * cancellations settle no refund and touch no stock. Not-found and invalid
 * transitions never mutate. Retrying is safe — a rolled-back failure re-runs
 * cleanly, and re-cancelling an already-cancelled order is rejected as an
 * invalid transition without side effects.
 */
export async function cancelOrderAtomically(
  ports: CancelOrderPorts,
  orderId: string,
): Promise<CancelOrderOutcome> {
  try {
    return await ports.transaction.run(async (): Promise<CancelOrderOutcome> => {
      const result = await ports.orders.updateOrderStatus(orderId, "cancelled");
      if (result.status === "not-found") return { status: "not-found" };
      if (result.status === "invalid-transition") {
        return { status: "invalid-transition", order: result.order };
      }

      const { order } = result;
      const refunded = ports.finance.projectRefund(order).length > 0;
      if (refunded) {
        try {
          await ports.inventory.revertOrderConsumption(order);
        } catch (cause) {
          throw new InventoryReversalError(cause);
        }
      }
      return { status: "cancelled", order, refunded };
    });
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof InventoryReversalError ? "inventory-reversal" : "transaction",
      retryable: true,
      dataChanged: false,
    };
  }
}
