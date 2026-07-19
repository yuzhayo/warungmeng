import type { Order, OrderStatus } from "./types";

const ORDER_STATUS_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  new: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function getAllowedOrderStatusTransitions(status: OrderStatus): readonly OrderStatus[] {
  return ORDER_STATUS_TRANSITIONS[status];
}

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function transitionOrderStatus(
  order: Order,
  nextStatus: OrderStatus,
  occurredAt: string,
  eventId: string,
): Order | null {
  if (!canTransitionOrderStatus(order.status, nextStatus)) return null;

  return {
    ...order,
    status: nextStatus,
    updatedAt: occurredAt,
    events: [
      ...order.events,
      {
        id: eventId,
        status: nextStatus,
        occurredAt,
        note: "",
      },
    ],
  };
}
