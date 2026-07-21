import { describe, expect, it } from "vitest";
import type { Money } from "../catalog/types";
import type { Order } from "./types";
import {
  canTransitionOrderStatus,
  getAllowedOrderStatusTransitions,
  transitionOrderStatus,
} from "./transitions";

const zero: Money = { amount: 0, currency: "IDR" };

function createOrder(): Order {
  return {
    id: "order-1",
    orderNumber: "WM-001",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    channel: "pos",
    fulfillment: "takeaway",
    paymentStatus: "paid",
    paymentMethod: "cash",
    status: "new",
    customer: null,
    items: [],
    totals: {
      subtotal: zero,
      discount: zero,
      tax: zero,
      serviceCharge: zero,
      rounding: zero,
      total: zero,
    },
    customerNote: "",
    internalNote: "",
    createdAt: "2026-07-19T10:00:00.000Z",
    updatedAt: "2026-07-19T10:00:00.000Z",
    events: [
      {
        id: "event-1",
        status: "new",
        occurredAt: "2026-07-19T10:00:00.000Z",
        note: "",
      },
    ],
  };
}

describe("order status transitions", () => {
  it("exposes only the valid next states", () => {
    expect(getAllowedOrderStatusTransitions("new")).toEqual(["accepted", "cancelled"]);
    expect(getAllowedOrderStatusTransitions("completed")).toEqual([]);
    expect(canTransitionOrderStatus("preparing", "ready")).toBe(true);
    expect(canTransitionOrderStatus("preparing", "completed")).toBe(false);
  });

  it("returns a new order and appends an event for a valid transition", () => {
    const order = createOrder();
    const updated = transitionOrderStatus(order, "accepted", "2026-07-19T10:05:00.000Z", "event-2");

    expect(updated).toMatchObject({
      status: "accepted",
      updatedAt: "2026-07-19T10:05:00.000Z",
    });
    expect(updated?.events).toHaveLength(2);
    expect(order.status).toBe("new");
    expect(order.events).toHaveLength(1);
  });

  it("rejects invalid and terminal transitions", () => {
    const order = createOrder();

    expect(transitionOrderStatus(order, "ready", "2026-07-19T10:05:00.000Z", "event-2")).toBeNull();
    expect(
      transitionOrderStatus(
        { ...order, status: "completed" },
        "cancelled",
        "2026-07-19T10:05:00.000Z",
        "event-2",
      ),
    ).toBeNull();
  });

  it("settles a paid order as refunded when it is cancelled (QA-ADM-005)", () => {
    const order = createOrder();
    const cancelled = transitionOrderStatus(order, "cancelled", "2026-07-19T11:00:00.000Z", "e-2");

    expect(cancelled).toMatchObject({ status: "cancelled", paymentStatus: "refunded" });
  });

  it("keeps the payment status when cancelling an unpaid order", () => {
    const order = { ...createOrder(), paymentStatus: "unpaid" as const };
    const cancelled = transitionOrderStatus(order, "cancelled", "2026-07-19T11:00:00.000Z", "e-2");

    expect(cancelled).toMatchObject({ status: "cancelled", paymentStatus: "unpaid" });
  });

  it("does not touch the payment status on non-cancel transitions", () => {
    const order = createOrder();
    const accepted = transitionOrderStatus(order, "accepted", "2026-07-19T11:00:00.000Z", "e-2");

    expect(accepted).toMatchObject({ status: "accepted", paymentStatus: "paid" });
  });
});
