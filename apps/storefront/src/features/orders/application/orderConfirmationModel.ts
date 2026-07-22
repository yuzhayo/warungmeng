import type { Order, OrderFulfillment, OrderStatus } from "@warungmeng/domain";
import type {
  RecentOrderReceipt,
  RecentOrderReceiptItem,
} from "../../checkout/application/recentOrderReceiptStorage";

const ORDER_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;

export const ACTIVE_ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "completed",
] as const satisfies readonly OrderStatus[];

export interface OrderConfirmationView {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly fulfillment: OrderFulfillment;
  readonly items: readonly RecentOrderReceiptItem[];
  readonly subtotal: number;
  readonly total: number;
  readonly createdAt: string;
}

export interface OrderStatusPresentation {
  readonly status: OrderStatus;
  readonly labelKey: string;
  readonly progressIndex: number;
  readonly cancelled: boolean;
}

export function isValidStorefrontOrderId(value: string | undefined): value is string {
  return value !== undefined && ORDER_ID_PATTERN.test(value);
}

export function createOrderConfirmationView(order: Order): OrderConfirmationView {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillment: order.fulfillment,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      optionNames: item.variantSelections.map((selection) => selection.optionName),
      lineTotal: item.lineTotal.amount,
    })),
    subtotal: order.totals.subtotal.amount,
    total: order.totals.total.amount,
    createdAt: order.createdAt,
  };
}

export function createReceiptConfirmationView(receipt: RecentOrderReceipt): OrderConfirmationView {
  return {
    orderId: receipt.orderId,
    orderNumber: receipt.orderNumber,
    status: receipt.status,
    fulfillment: receipt.fulfillment,
    items: receipt.items.map((item) => ({ ...item, optionNames: [...item.optionNames] })),
    subtotal: receipt.subtotal,
    total: receipt.total,
    createdAt: receipt.createdAt,
  };
}

export function getOrderStatusPresentation(status: OrderStatus): OrderStatusPresentation {
  if (status === "cancelled") {
    return {
      status,
      labelKey: "storefront.order.status.cancelled",
      progressIndex: 0,
      cancelled: true,
    };
  }

  return {
    status,
    labelKey: `storefront.order.status.${status}`,
    progressIndex: ACTIVE_ORDER_STATUSES.indexOf(status),
    cancelled: false,
  };
}
