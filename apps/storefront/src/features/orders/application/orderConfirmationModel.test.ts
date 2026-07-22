import { describe, expect, it } from "vitest";
import type { Order, OrderStatus } from "@warungmeng/domain";
import type { RecentOrderReceipt } from "../../checkout/application/recentOrderReceiptStorage";
import {
  ACTIVE_ORDER_STATUSES,
  createOrderConfirmationView,
  createReceiptConfirmationView,
  getOrderStatusPresentation,
  isValidStorefrontOrderId,
} from "./orderConfirmationModel";

function createOrder(status: OrderStatus = "new"): Order {
  return {
    id: "order-1",
    orderNumber: "WM-WEB-1",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    channel: "storefront",
    fulfillment: "takeaway",
    paymentStatus: "unpaid",
    paymentMethod: "cash",
    status,
    customer: { name: "Private Name", phone: "081234567890" },
    items: [
      {
        id: "line-1",
        menuItemId: "menu-1",
        name: "GADO-GADO",
        quantity: 2,
        unitPrice: { amount: 22_000, currency: "IDR" },
        variantSelections: [
          {
            groupId: "group-1",
            groupName: "Porsi",
            optionId: "regular",
            optionName: "REGULER",
            priceAdjustment: { amount: 0, currency: "IDR" },
          },
        ],
        note: "private item note",
        lineTotal: { amount: 44_000, currency: "IDR" },
      },
    ],
    totals: {
      subtotal: { amount: 44_000, currency: "IDR" },
      discount: { amount: 0, currency: "IDR" },
      tax: { amount: 0, currency: "IDR" },
      serviceCharge: { amount: 0, currency: "IDR" },
      rounding: { amount: 0, currency: "IDR" },
      total: { amount: 44_000, currency: "IDR" },
    },
    customerNote: "private order note",
    internalNote: "private internal note",
    createdAt: "2026-07-22T06:00:00.000Z",
    updatedAt: "2026-07-22T06:00:00.000Z",
    events: [],
  };
}

const receipt: RecentOrderReceipt = {
  version: 1,
  orderId: "order-1",
  orderNumber: "WM-WEB-1",
  status: "new",
  fulfillment: "takeaway",
  items: [{ name: "GADO-GADO", quantity: 1, optionNames: [], lineTotal: 22_000 }],
  subtotal: 22_000,
  total: 22_000,
  createdAt: "2026-07-22T06:00:00.000Z",
};

describe("orderConfirmationModel", () => {
  it.each(["order-1", "abc_DEF-123", "A"])("accepts a bounded opaque ID: %s", (id) => {
    expect(isValidStorefrontOrderId(id)).toBe(true);
  });

  it.each([undefined, "", "has/slash", "white space", `x${"y".repeat(128)}`])(
    "rejects an invalid order ID: %s",
    (id) => expect(isValidStorefrontOrderId(id)).toBe(false),
  );

  it("projects an order without customer PII or notes", () => {
    const view = createOrderConfirmationView(createOrder());
    const serialized = JSON.stringify(view);
    expect(view).toMatchObject({ orderId: "order-1", total: 44_000 });
    expect(serialized).not.toContain("Private Name");
    expect(serialized).not.toContain("081234567890");
    expect(serialized).not.toContain("private");
  });

  it("copies a receipt into an immutable confirmation view", () => {
    const view = createReceiptConfirmationView(receipt);
    expect(view).toMatchObject({ orderId: "order-1", orderNumber: "WM-WEB-1" });
    expect(view.items).not.toBe(receipt.items);
  });

  it.each(ACTIVE_ORDER_STATUSES)("maps %s to its progress position", (status) => {
    expect(getOrderStatusPresentation(status)).toEqual({
      status,
      labelKey: `storefront.order.status.${status}`,
      progressIndex: ACTIVE_ORDER_STATUSES.indexOf(status),
      cancelled: false,
    });
  });

  it("maps cancelled to an explicit non-success state", () => {
    expect(getOrderStatusPresentation("cancelled")).toMatchObject({
      cancelled: true,
      labelKey: "storefront.order.status.cancelled",
    });
  });
});
