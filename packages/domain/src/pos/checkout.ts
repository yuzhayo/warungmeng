import type { Order, OrderItem } from "../orders/types";
import { calculatePosItemLineTotal } from "./pricing";
import type { PosCartItem, PosCheckoutDraft, PosSession } from "./types";

export interface CreatePosOrderInput {
  readonly orderNumber: string;
  readonly session: Extract<PosSession, { status: "open" }>;
  readonly items: readonly PosCartItem[];
  readonly checkout: PosCheckoutDraft;
  readonly totals: Order["totals"];
  readonly occurredAt: string;
  readonly eventId: string;
}

export function createPosOrder(input: CreatePosOrderInput): Omit<Order, "id"> {
  if (input.items.length === 0) throw new RangeError("POS order must contain at least one item");

  const items: OrderItem[] = input.items.map((item) => ({
    id: item.id,
    menuItemId: item.menuItemId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: { ...item.unitPrice },
    variantSelections: item.variantSelections.map((selection) => ({
      ...selection,
      priceAdjustment: { ...selection.priceAdjustment },
    })),
    note: item.note,
    lineTotal: { amount: calculatePosItemLineTotal(item), currency: "IDR" },
  }));

  return {
    orderNumber: input.orderNumber,
    outletId: input.session.outlet.id,
    outletName: input.session.outlet.name,
    channel: "pos",
    fulfillment: input.checkout.fulfillment,
    paymentStatus: "paid",
    paymentMethod: input.checkout.paymentMethod,
    status: "new",
    customer: null,
    items,
    totals: structuredClone(input.totals),
    customerNote: "",
    internalNote: "",
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
    events: [
      {
        id: input.eventId,
        status: "new",
        occurredAt: input.occurredAt,
        note: "Created from POS cashier",
      },
    ],
  };
}
