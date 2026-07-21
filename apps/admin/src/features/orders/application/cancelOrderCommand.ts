import type {
  InventoryRepository,
  OrderRepository,
  OrderStatusUpdateResult,
} from "@warungmeng/data";

export interface CancelOrderOutcome {
  readonly result: OrderStatusUpdateResult;
  readonly refunded: boolean;
  readonly stockReversalFailed: boolean;
}

/**
 * Cancels an order and settles its side effects in one command:
 * a paid order becomes refunded (the finance ledger projects the offset
 * automatically) and its recorded stock consumption is reversed.
 * Safe to retry — the reversal is idempotent by order id, and re-running the
 * command on an already-cancelled refunded order only heals a missing
 * reversal without duplicating anything.
 */
export async function cancelOrderWithSettlement(
  orders: OrderRepository,
  inventory: InventoryRepository,
  orderId: string,
): Promise<CancelOrderOutcome> {
  const result = await orders.updateOrderStatus(orderId, "cancelled");

  const settledOrder =
    result.status === "updated"
      ? result.order
      : result.status === "invalid-transition" &&
          result.order.status === "cancelled" &&
          result.order.paymentStatus === "refunded"
        ? result.order
        : null;

  if (!settledOrder || settledOrder.paymentStatus !== "refunded") {
    return { result, refunded: false, stockReversalFailed: false };
  }

  let stockReversalFailed = false;
  try {
    await inventory.revertOrderConsumption(settledOrder);
  } catch {
    stockReversalFailed = true;
  }
  return { result, refunded: true, stockReversalFailed };
}
