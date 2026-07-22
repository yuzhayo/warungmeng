import type { Order } from "@warungmeng/domain";

export const RECENT_ORDER_RECEIPT_KEY = "wm.storefront.recent-order.v1";
const RECEIPT_VERSION = 1;

export interface RecentOrderReceiptItem {
  readonly name: string;
  readonly quantity: number;
  readonly optionNames: readonly string[];
  readonly lineTotal: number;
}

export interface RecentOrderReceipt {
  readonly version: 1;
  readonly orderId: string;
  readonly orderNumber: string;
  readonly status: Order["status"];
  readonly fulfillment: Order["fulfillment"];
  readonly items: readonly RecentOrderReceiptItem[];
  readonly subtotal: number;
  readonly total: number;
  readonly createdAt: string;
}

export interface ReceiptStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createRecentOrderReceipt(order: Order): RecentOrderReceipt {
  return {
    version: RECEIPT_VERSION,
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

function isReceipt(value: unknown): value is RecentOrderReceipt {
  if (!value || typeof value !== "object") return false;
  const receipt = value as Partial<RecentOrderReceipt>;
  const validStatuses: readonly Order["status"][] = [
    "new",
    "accepted",
    "preparing",
    "ready",
    "completed",
    "cancelled",
  ];
  const itemsValid =
    Array.isArray(receipt.items) &&
    receipt.items.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof item.name === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        Array.isArray(item.optionNames) &&
        item.optionNames.every((name: unknown) => typeof name === "string") &&
        Number.isInteger(item.lineTotal) &&
        item.lineTotal >= 0,
    );

  return (
    receipt.version === RECEIPT_VERSION &&
    typeof receipt.orderId === "string" &&
    receipt.orderId.length > 0 &&
    typeof receipt.orderNumber === "string" &&
    receipt.orderNumber.length > 0 &&
    receipt.status !== undefined &&
    validStatuses.includes(receipt.status) &&
    (receipt.fulfillment === "takeaway" ||
      receipt.fulfillment === "dine-in" ||
      receipt.fulfillment === "delivery") &&
    typeof receipt.createdAt === "string" &&
    Number.isInteger(receipt.subtotal) &&
    (receipt.subtotal ?? -1) >= 0 &&
    Number.isInteger(receipt.total) &&
    (receipt.total ?? -1) >= 0 &&
    itemsValid
  );
}

export function saveRecentOrderReceipt(
  storage: ReceiptStorageLike | null,
  receipt: RecentOrderReceipt,
): void {
  if (!storage) return;
  try {
    storage.setItem(RECENT_ORDER_RECEIPT_KEY, JSON.stringify(receipt));
  } catch {
    // A completed order must not be duplicated merely because session storage is unavailable.
  }
}

export function loadRecentOrderReceipt(
  storage: ReceiptStorageLike | null,
): RecentOrderReceipt | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(RECENT_ORDER_RECEIPT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isReceipt(parsed)) return parsed;
    storage.removeItem(RECENT_ORDER_RECEIPT_KEY);
    return null;
  } catch {
    try {
      storage.removeItem(RECENT_ORDER_RECEIPT_KEY);
    } catch {
      // Storage cleanup is best-effort; malformed data must still fail closed.
    }
    return null;
  }
}
