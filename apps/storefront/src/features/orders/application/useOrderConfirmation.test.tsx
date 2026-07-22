import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Order } from "@warungmeng/domain";
import type { OrderRepository } from "@warungmeng/data";
import {
  RECENT_ORDER_RECEIPT_KEY,
  type ReceiptStorageLike,
} from "../../checkout/application/recentOrderReceiptStorage";
import { useOrderConfirmation } from "./useOrderConfirmation";

function createOrder(id = "order-1"): Order {
  return {
    id,
    orderNumber: "WM-WEB-1",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    channel: "storefront",
    fulfillment: "takeaway",
    paymentStatus: "unpaid",
    paymentMethod: "cash",
    status: "new",
    customer: { name: "Private", phone: "081234567890" },
    items: [],
    totals: {
      subtotal: { amount: 0, currency: "IDR" },
      discount: { amount: 0, currency: "IDR" },
      tax: { amount: 0, currency: "IDR" },
      serviceCharge: { amount: 0, currency: "IDR" },
      rounding: { amount: 0, currency: "IDR" },
      total: { amount: 0, currency: "IDR" },
    },
    customerNote: "",
    internalNote: "",
    createdAt: "2026-07-22T06:00:00.000Z",
    updatedAt: "2026-07-22T06:00:00.000Z",
    events: [],
  };
}

function createRepository(getOrderById: OrderRepository["getOrderById"]): OrderRepository {
  return {
    getOrderById,
    listOrders: vi.fn().mockResolvedValue([]),
    createOrder: vi.fn(),
    updateOrderStatus: vi.fn().mockResolvedValue({ status: "not-found" }),
  };
}

function memoryStorage(value?: string): ReceiptStorageLike {
  const values = new Map<string, string>();
  if (value) values.set(RECENT_ORDER_RECEIPT_KEY, value);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, next) => void values.set(key, next),
    removeItem: (key) => void values.delete(key),
  };
}

function receipt(orderId = "order-1") {
  return JSON.stringify({
    version: 1,
    orderId,
    orderNumber: "WM-WEB-1",
    status: "new",
    fulfillment: "takeaway",
    items: [],
    subtotal: 0,
    total: 0,
    createdAt: "2026-07-22T06:00:00.000Z",
  });
}

describe("useOrderConfirmation", () => {
  it("uses a repository order before a matching session receipt", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue(createOrder()));
    const storage = memoryStorage(receipt());
    const { result } = renderHook(() => useOrderConfirmation("order-1", repository, storage));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(repository.getOrderById).toHaveBeenCalledWith("order-1");
    if (result.current.status === "ready") expect(result.current.order.orderId).toBe("order-1");
  });

  it("falls back to an exactly matching receipt after repository reset", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue(null));
    const storage = memoryStorage(receipt());
    const { result } = renderHook(() => useOrderConfirmation("order-1", repository, storage));

    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("rejects a repository result whose ID does not match the route", async () => {
    const repository = createRepository(vi.fn().mockResolvedValue(createOrder("another-order")));
    const storage = memoryStorage();
    const { result } = renderHook(() => useOrderConfirmation("order-1", repository, storage));

    await waitFor(() => expect(result.current.status).toBe("not-found"));
  });

  it.each([
    ["malformed", "not-json"],
    ["mismatched", receipt("another-order")],
  ])("returns not-found for a %s receipt", async (_label, storedValue) => {
    const repository = createRepository(vi.fn().mockResolvedValue(null));
    const storage = memoryStorage(storedValue);
    const { result } = renderHook(() => useOrderConfirmation("order-1", repository, storage));

    await waitFor(() => expect(result.current.status).toBe("not-found"));
  });

  it("does not query the repository for an invalid ID", async () => {
    const repository = createRepository(vi.fn());
    const { result } = renderHook(() => useOrderConfirmation("bad/id", repository, null));

    await waitFor(() => expect(result.current.status).toBe("not-found"));
    expect(repository.getOrderById).not.toHaveBeenCalled();
  });

  it("uses the matching receipt when the repository errors", async () => {
    const repository = createRepository(vi.fn().mockRejectedValue(new Error("offline")));
    const storage = memoryStorage(receipt());
    const { result } = renderHook(() => useOrderConfirmation("order-1", repository, storage));

    await waitFor(() => expect(result.current.status).toBe("ready"));
  });

  it("exposes retry after repository failure without a receipt", async () => {
    const getOrderById = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(createOrder());
    const repository = createRepository(getOrderById);
    const { result } = renderHook(() => useOrderConfirmation("order-1", repository, null));

    await waitFor(() => expect(result.current.status).toBe("error"));
    act(() => {
      if (result.current.status === "error") result.current.retry();
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(getOrderById).toHaveBeenCalledTimes(2);
  });
});
