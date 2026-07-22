import { describe, expect, it } from "vitest";
import type { Order } from "@warungmeng/domain";
import {
  createRecentOrderReceipt,
  loadRecentOrderReceipt,
  RECENT_ORDER_RECEIPT_KEY,
  saveRecentOrderReceipt,
  type ReceiptStorageLike,
} from "./recentOrderReceiptStorage";

function memoryStorage(): ReceiptStorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

const order: Order = {
  id: "order-1",
  orderNumber: "WM-WEB-1",
  outletId: "wm-1",
  outletName: "WARUNG MENG",
  channel: "storefront",
  fulfillment: "takeaway",
  paymentStatus: "unpaid",
  paymentMethod: "cash",
  status: "new",
  customer: { name: "Secret Name", phone: "081234567890" },
  items: [
    {
      id: "item-1",
      menuItemId: "menu-1",
      name: "GADO-GADO",
      quantity: 1,
      unitPrice: { amount: 22_000, currency: "IDR" },
      variantSelections: [],
      note: "secret note",
      lineTotal: { amount: 22_000, currency: "IDR" },
    },
  ],
  totals: {
    subtotal: { amount: 22_000, currency: "IDR" },
    discount: { amount: 0, currency: "IDR" },
    tax: { amount: 0, currency: "IDR" },
    serviceCharge: { amount: 0, currency: "IDR" },
    rounding: { amount: 0, currency: "IDR" },
    total: { amount: 22_000, currency: "IDR" },
  },
  customerNote: "secret order note",
  internalNote: "secret internal note",
  createdAt: "2026-07-22T06:00:00.000Z",
  updatedAt: "2026-07-22T06:00:00.000Z",
  events: [],
};

describe("recentOrderReceiptStorage", () => {
  it("stores only confirmation-safe receipt fields", () => {
    const storage = memoryStorage();
    saveRecentOrderReceipt(storage, createRecentOrderReceipt(order));
    const raw = storage.data.get(RECENT_ORDER_RECEIPT_KEY) ?? "";

    expect(loadRecentOrderReceipt(storage)).toMatchObject({
      orderId: "order-1",
      orderNumber: "WM-WEB-1",
      total: 22_000,
    });
    expect(raw).not.toContain("Secret Name");
    expect(raw).not.toContain("081234567890");
    expect(raw).not.toContain("secret note");
  });

  it.each(["not-json", '{"version":2}', '{"version":1,"orderId":3}'])(
    "rejects malformed or incompatible data: %s",
    (value) => {
      const storage = memoryStorage();
      storage.setItem(RECENT_ORDER_RECEIPT_KEY, value);
      expect(loadRecentOrderReceipt(storage)).toBeNull();
      expect(storage.getItem(RECENT_ORDER_RECEIPT_KEY)).toBeNull();
    },
  );
});
