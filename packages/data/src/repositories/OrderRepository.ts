import type { Order, OrderChannel, OrderStatus } from "@warungmeng/domain";

export interface OrderListQuery {
  readonly search?: string;
  readonly status?: OrderStatus;
  readonly outletId?: string;
  readonly channel?: OrderChannel;
  readonly dateFrom?: string;
  readonly dateTo?: string;
}

export type OrderStatusUpdateResult =
  | { readonly status: "updated"; readonly order: Order }
  | { readonly status: "not-found" }
  | { readonly status: "invalid-transition"; readonly order: Order };

export interface OrderRepository {
  listOrders(query?: OrderListQuery): Promise<readonly Order[]>;
  getOrderById(id: string): Promise<Order | null>;
  updateOrderStatus(id: string, nextStatus: OrderStatus): Promise<OrderStatusUpdateResult>;
}
