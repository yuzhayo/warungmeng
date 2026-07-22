import { describe, expect, it } from "vitest";
import type { StorefrontCartItem } from "../../cart/application/storefrontCartModel";
import { createStorefrontOrderInput } from "./createStorefrontOrderInput";

const cartItem: StorefrontCartItem = {
  id: "cart-1",
  menuItemId: "menu-1",
  name: "GADO-GADO",
  unitPrice: { amount: 22_000, currency: "IDR" },
  quantity: 2,
  note: "tanpa sambal",
  variantSelections: [
    {
      groupId: "portion",
      groupName: "Porsi",
      optionId: "large",
      optionName: "Besar",
      priceAdjustment: { amount: 3_000, currency: "IDR" },
    },
  ],
};

describe("createStorefrontOrderInput", () => {
  it("maps a cart to a deterministic unpaid storefront pickup order without mutation", () => {
    const items = [cartItem];
    const before = structuredClone(items);
    const order = createStorefrontOrderInput(
      {
        customerName: " Budi  Santoso ",
        customerPhone: "+62 812-3456-7890",
        customerNote: " ambil jam 12 ",
        fulfillment: "takeaway",
        paymentMethod: "cash",
      },
      items,
      {
        now: () => "2026-07-22T06:00:00.000Z",
        createOrderNumber: () => "WM-WEB-0001",
        createEventId: () => "event-1",
      },
    );

    expect(order).toMatchObject({
      orderNumber: "WM-WEB-0001",
      outletId: "wm-1",
      channel: "storefront",
      fulfillment: "takeaway",
      paymentStatus: "unpaid",
      paymentMethod: "cash",
      customer: { name: "Budi Santoso", phone: "+6281234567890" },
      customerNote: "ambil jam 12",
      totals: { subtotal: { amount: 50_000 }, total: { amount: 50_000 } },
    });
    expect(order.items[0]?.lineTotal.amount).toBe(50_000);
    expect(items).toEqual(before);
  });

  it("rejects invalid drafts and empty carts", () => {
    expect(() =>
      createStorefrontOrderInput(
        {
          customerName: "",
          customerPhone: "abc",
          customerNote: "",
          fulfillment: "takeaway",
          paymentMethod: "cash",
        },
        [],
        { now: () => "now", createOrderNumber: () => "number", createEventId: () => "event" },
      ),
    ).toThrow("Invalid storefront checkout draft");
  });

  it("rejects invalid cart money before mapping", () => {
    expect(() =>
      createStorefrontOrderInput(
        {
          customerName: "Budi",
          customerPhone: "081234567890",
          customerNote: "",
          fulfillment: "takeaway",
          paymentMethod: "cash",
        },
        [{ ...cartItem, unitPrice: { amount: -1, currency: "IDR" } }],
        { now: () => "now", createOrderNumber: () => "number", createEventId: () => "event" },
      ),
    ).toThrow("Invalid storefront cart amounts");
  });
});
