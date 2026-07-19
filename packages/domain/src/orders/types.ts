import type { Money } from "../catalog/types";

export const ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderChannel = "pos" | "storefront" | "manual";
export type OrderFulfillment = "dine-in" | "takeaway" | "delivery";
export type OrderPaymentStatus = "unpaid" | "paid" | "refunded";

export interface OrderCustomer {
  readonly name: string;
  readonly phone: string;
}

export interface OrderVariantSelection {
  readonly groupId: string;
  readonly groupName: string;
  readonly optionId: string;
  readonly optionName: string;
  readonly priceAdjustment: Money;
}

export interface OrderItem {
  readonly id: string;
  readonly menuItemId: string;
  readonly name: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly variantSelections: readonly OrderVariantSelection[];
  readonly note: string;
  readonly lineTotal: Money;
}

export interface OrderTotals {
  readonly subtotal: Money;
  readonly discount: Money;
  readonly tax: Money;
  readonly serviceCharge: Money;
  readonly total: Money;
}

export interface OrderStatusEvent {
  readonly id: string;
  readonly status: OrderStatus;
  readonly occurredAt: string;
  readonly note: string;
}

export interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly outletId: string;
  readonly outletName: string;
  readonly channel: OrderChannel;
  readonly fulfillment: OrderFulfillment;
  readonly paymentStatus: OrderPaymentStatus;
  readonly status: OrderStatus;
  readonly customer: OrderCustomer | null;
  readonly items: readonly OrderItem[];
  readonly totals: OrderTotals;
  readonly customerNote: string;
  readonly internalNote: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly events: readonly OrderStatusEvent[];
}
