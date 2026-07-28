import type { OrderStatusUpdateResult } from "@warungmeng/data";
import type { OrderStatus } from "@warungmeng/domain";

/**
 * Narrow order port for cancellation: only the status transition the command
 * needs. The composition-owned Order repository satisfies this structurally.
 */
export interface OrderCancellationPort {
  updateOrderStatus(id: string, nextStatus: OrderStatus): Promise<OrderStatusUpdateResult>;
}
