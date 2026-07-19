import { InMemoryOrderRepository } from "@warungmeng/data";
import type { MenuItem } from "@warungmeng/domain";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePosCashier } from "./usePosCashier";

const menu: MenuItem = {
  id: "menu-1",
  name: "ES TEH JUMBO",
  slug: "es-teh-jumbo",
  categoryId: "drink",
  description: "",
  image: null,
  price: { amount: 6_000, currency: "IDR" },
  compareAtPrice: null,
  availability: { status: "available" },
  inventory: { mode: "untracked" },
  visibility: "visible",
  salesSchedule: { mode: "always" },
  variantGroupIds: [],
  sortOrder: 0,
};

describe("usePosCashier", () => {
  it("opens a session, checks out, and persists the POS order", async () => {
    const repository = new InMemoryOrderRepository([], undefined, undefined, () => "order-pos-1");
    let id = 0;
    const { result } = renderHook(() =>
      usePosCashier(
        repository,
        { id: "wm-1", name: "WARUNG MENG" },
        {
          now: () => new Date(2026, 6, 19, 10, 0, 0),
          id: () => String(++id),
        },
      ),
    );

    act(() => {
      result.current.startSession();
      result.current.addMenu(menu, [], "Less ice");
      result.current.updateCheckout({ paymentMethod: "qris" });
    });

    await act(async () => {
      await result.current.completeCheckout();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.receipt).toMatchObject({
      orderId: "order-pos-1",
      orderNumber: "WM-POS-260719-100000-001",
      paymentMethod: "qris",
    });
    await expect(repository.getOrderById("order-pos-1")).resolves.toMatchObject({
      channel: "pos",
      status: "new",
      paymentStatus: "paid",
      items: [{ name: "ES TEH JUMBO", note: "Less ice" }],
    });
  });
});
