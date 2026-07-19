import type {
  Money,
  Order,
  OrderChannel,
  OrderFulfillment,
  OrderPaymentStatus,
  OrderStatus,
} from "@warungmeng/domain";
import { InMemoryOrderRepository } from "./InMemoryOrderRepository";

function money(amount: number): Money {
  return { amount, currency: "IDR" };
}

interface OrderFixtureInput {
  readonly id: string;
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly channel: OrderChannel;
  readonly fulfillment: OrderFulfillment;
  readonly paymentStatus: OrderPaymentStatus;
  readonly outletId: "wm-1" | "wm-2";
  readonly outletName: "WARUNG MENG" | "WARUNG MENG 2";
  readonly customerName?: string;
  readonly customerPhone?: string;
  readonly menuName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly createdAt: string;
}

function createOrderFixture(input: OrderFixtureInput): Order {
  const subtotal = input.quantity * input.unitPrice;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + tax;
  const customer = input.customerName
    ? { name: input.customerName, phone: input.customerPhone ?? "" }
    : null;

  return {
    id: input.id,
    orderNumber: input.orderNumber,
    outletId: input.outletId,
    outletName: input.outletName,
    channel: input.channel,
    fulfillment: input.fulfillment,
    paymentStatus: input.paymentStatus,
    paymentMethod:
      input.channel === "pos" ? "cash" : input.channel === "storefront" ? "qris" : "unknown",
    status: input.status,
    customer,
    items: [
      {
        id: `${input.id}-item-1`,
        menuItemId: `${input.id}-menu-1`,
        name: input.menuName,
        quantity: input.quantity,
        unitPrice: money(input.unitPrice),
        variantSelections: [],
        note: "",
        lineTotal: money(subtotal),
      },
    ],
    totals: {
      subtotal: money(subtotal),
      discount: money(0),
      tax: money(tax),
      serviceCharge: money(0),
      rounding: money(0),
      total: money(total),
    },
    customerNote: "",
    internalNote: "",
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    events: [
      {
        id: `${input.id}-event-1`,
        status: "new",
        occurredAt: input.createdAt,
        note: "",
      },
      ...(input.status === "new"
        ? []
        : [
            {
              id: `${input.id}-event-2`,
              status: input.status,
              occurredAt: input.createdAt,
              note: "",
            },
          ]),
    ],
  };
}

export const WARUNG_MENG_ORDER_FIXTURES: readonly Order[] = [
  createOrderFixture({
    id: "order-1008",
    orderNumber: "WM-1008",
    status: "new",
    channel: "storefront",
    fulfillment: "takeaway",
    paymentStatus: "paid",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    customerName: "Rina",
    customerPhone: "081234567801",
    menuName: "GADO-GADO",
    quantity: 2,
    unitPrice: 22_000,
    createdAt: "2026-07-19T13:40:00.000Z",
  }),
  createOrderFixture({
    id: "order-1007",
    orderNumber: "WM-1007",
    status: "accepted",
    channel: "pos",
    fulfillment: "dine-in",
    paymentStatus: "paid",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    menuName: "LONTONG BALAP",
    quantity: 1,
    unitPrice: 20_000,
    createdAt: "2026-07-19T13:25:00.000Z",
  }),
  createOrderFixture({
    id: "order-1006",
    orderNumber: "WM-1006",
    status: "preparing",
    channel: "manual",
    fulfillment: "takeaway",
    paymentStatus: "unpaid",
    outletId: "wm-2",
    outletName: "WARUNG MENG 2",
    customerName: "Bagus",
    customerPhone: "081234567802",
    menuName: "ES TELER CREAMY",
    quantity: 2,
    unitPrice: 22_000,
    createdAt: "2026-07-19T12:50:00.000Z",
  }),
  createOrderFixture({
    id: "order-1005",
    orderNumber: "WM-1005",
    status: "ready",
    channel: "storefront",
    fulfillment: "delivery",
    paymentStatus: "paid",
    outletId: "wm-2",
    outletName: "WARUNG MENG 2",
    customerName: "Sari",
    customerPhone: "081234567803",
    menuName: "THAI TEA",
    quantity: 3,
    unitPrice: 12_000,
    createdAt: "2026-07-19T12:10:00.000Z",
  }),
  createOrderFixture({
    id: "order-1004",
    orderNumber: "WM-1004",
    status: "completed",
    channel: "pos",
    fulfillment: "dine-in",
    paymentStatus: "paid",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    menuName: "LONTONG KUPANG",
    quantity: 2,
    unitPrice: 20_000,
    createdAt: "2026-07-18T15:30:00.000Z",
  }),
  createOrderFixture({
    id: "order-1003",
    orderNumber: "WM-1003",
    status: "cancelled",
    channel: "storefront",
    fulfillment: "takeaway",
    paymentStatus: "refunded",
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    customerName: "Dian",
    customerPhone: "081234567804",
    menuName: "ES TEH JUMBO",
    quantity: 1,
    unitPrice: 6_000,
    createdAt: "2026-07-18T14:10:00.000Z",
  }),
];

export function createWarungMengOrderRepository(): InMemoryOrderRepository {
  return new InMemoryOrderRepository(WARUNG_MENG_ORDER_FIXTURES);
}
