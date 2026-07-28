import type { OrderListQuery, OrderStatusUpdateResult } from "@warungmeng/data";
import type { Order, OrderStatus } from "@warungmeng/domain";
import type { CancelOrderOutcome } from "./commands/cancelOrderCommand";

/** Read surface published as `orders.read`. The Order repository satisfies it structurally. */
export interface OrdersReadCapability {
  listOrders(query?: OrderListQuery): Promise<readonly Order[]>;
  getOrderById(id: string): Promise<Order | null>;
}

/**
 * Workflow surface published as `orders.manage`. `cancel` is the single
 * active cancellation command: atomic and idempotent per
 * {@link CancelOrderOutcome}.
 */
export interface OrdersManageCapability {
  updateStatus(orderId: string, status: OrderStatus): Promise<OrderStatusUpdateResult>;
  cancel(orderId: string): Promise<CancelOrderOutcome>;
}
