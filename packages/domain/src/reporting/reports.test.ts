import { describe, expect, it } from "vitest";
import type { Money, MenuCategory, MenuItem } from "../catalog/types";
import type { FinanceTransaction } from "../finance/types";
import type {
  InventoryIngredient,
  InventoryMovement,
  InventoryStockBalance,
  MenuHppBreakdown,
} from "../inventory/types";
import type { Order, OrderItem } from "../orders/types";
import {
  buildCategoryPerformance,
  buildInventoryUsage,
  buildMenuPerformance,
  buildPeakSalesHours,
} from "./reports";
import type { ReportingSnapshot } from "./types";

const idr = (amount: number): Money => ({ amount, currency: "IDR" });

function menu(id: string, name: string, categoryId = "food"): MenuItem {
  return {
    id,
    name,
    slug: id,
    categoryId,
    description: "",
    image: null,
    price: idr(20_000),
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds: [],
    sortOrder: 1,
  };
}

function orderItem(menuItemId: string, name: string, amount = 20_000): OrderItem {
  return {
    id: `line-${menuItemId}`,
    menuItemId,
    name,
    quantity: 1,
    unitPrice: idr(amount),
    variantSelections: [],
    note: "",
    lineTotal: idr(amount),
  };
}

function order(id: string, items: readonly OrderItem[], patch: Partial<Order> = {}): Order {
  return {
    id,
    orderNumber: id.toUpperCase(),
    outletId: "wm-1",
    outletName: "Warung Meng",
    channel: "pos",
    fulfillment: "dine-in",
    paymentStatus: "paid",
    paymentMethod: "cash",
    status: "completed",
    customer: null,
    items,
    totals: {
      subtotal: idr(20_000),
      discount: idr(0),
      tax: idr(0),
      serviceCharge: idr(0),
      rounding: idr(0),
      total: idr(20_000),
    },
    customerNote: "",
    internalNote: "",
    createdAt: "2026-07-20T03:00:00.000Z",
    updatedAt: "2026-07-20T03:00:00.000Z",
    events: [],
    ...patch,
  };
}

function sale(
  id: string,
  orderId: string,
  amount = 20_000,
  occurredAt = "2026-07-20T03:00:00.000Z",
): FinanceTransaction {
  return {
    id,
    occurredAt,
    direction: "inflow",
    type: "sale",
    source: "automatic",
    status: "posted",
    categoryId: "sales",
    categoryLabel: "Penjualan",
    amount: idr(amount),
    paymentMethod: "cash",
    description: "Sale",
    referenceNumber: orderId,
    sourceReference: orderId,
    attachment: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  };
}

function hpp(menuItemId: string, amount: number): MenuHppBreakdown {
  return {
    menuItemId,
    ingredientCosts: [],
    ingredientTotal: idr(amount),
    packagingCost: idr(0),
    additionalCost: idr(0),
    total: idr(amount),
  };
}

function snapshot(patch: Partial<ReportingSnapshot> = {}): ReportingSnapshot {
  const food: MenuCategory = {
    id: "food",
    name: "Makanan",
    slug: "makanan",
    visibility: "visible",
    sortOrder: 1,
  };
  return {
    period: { startDate: "2026-07-20", endDate: "2026-07-20", timeZone: "Asia/Jakarta" },
    orders: [],
    financeTransactions: [],
    menuItems: [],
    categories: [food],
    menuHpp: [],
    ingredients: [],
    stockBalances: [],
    inventoryMovements: [],
    ...patch,
  };
}

describe("report view selectors", () => {
  it("uses deterministic menu ranking ties: quantity, net sales, name, then ID", () => {
    const menus = [menu("menu-b", "Bakso"), menu("menu-a", "Ayam")];
    const orders = [
      order("order-b", [orderItem("menu-b", "Bakso")]),
      order("order-a", [orderItem("menu-a", "Ayam")]),
    ];
    const rows = buildMenuPerformance(
      snapshot({
        menuItems: menus,
        orders,
        financeTransactions: [sale("sale-b", "order-b"), sale("sale-a", "order-a")],
        menuHpp: [hpp("menu-a", 5_000), hpp("menu-b", 5_000)],
      }),
    );

    expect(rows.map((row) => row.menuName)).toEqual(["Ayam", "Bakso"]);
  });

  it("subtracts refunds and flags a missing menu cost", () => {
    const sourceOrder = order("order-1", [orderItem("menu-1", "Gado-gado")]);
    const refund: FinanceTransaction = {
      ...sale("refund-1", "order-1"),
      direction: "outflow",
      type: "refund",
    };
    const [row] = buildMenuPerformance(
      snapshot({ orders: [sourceOrder], financeTransactions: [sale("sale-1", "order-1"), refund] }),
    );

    expect(row).toMatchObject({ quantitySold: 0, missingCost: true });
    expect(row?.netSales.amount).toBe(0);
  });

  it("groups current catalog categories and keeps missing catalog items unknown", () => {
    const knownOrder = order("order-known", [orderItem("menu-known", "Known")]);
    const unknownOrder = order("order-unknown", [orderItem("menu-unknown", "Legacy")]);
    const rows = buildCategoryPerformance(
      snapshot({
        menuItems: [menu("menu-known", "Known")],
        orders: [knownOrder, unknownOrder],
        financeTransactions: [
          sale("sale-known", "order-known", 20_000),
          sale("sale-unknown", "order-unknown", 10_000),
        ],
      }),
    );

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: "food", categoryName: "Makanan" }),
        expect.objectContaining({ categoryId: null, categoryName: null }),
      ]),
    );
  });

  it("groups peak sales hours using WIB local time", () => {
    const rows = buildPeakSalesHours(
      snapshot({
        financeTransactions: [
          sale("sale-1", "order-1", 10_000, "2026-07-20T03:15:00.000Z"),
          sale("sale-2", "order-2", 20_000, "2026-07-20T03:45:00.000Z"),
          sale("sale-3", "order-3", 30_000, "2026-07-20T04:00:00.000Z"),
        ],
      }),
    );

    expect(rows[0]).toMatchObject({ hour: 10, paidOrderCount: 2, grossSales: idr(30_000) });
    expect(rows[1]).toMatchObject({ hour: 11, paidOrderCount: 1 });
  });

  it("ranks only in-period inventory consumption and calculates current low stock", () => {
    const ingredient: InventoryIngredient = {
      id: "rice",
      name: "Beras",
      baseUnit: "g",
      supplierId: null,
      status: "active",
      minimumStock: 1_000,
      lastPurchaseUnitCost: idr(0.02),
      averageUnitCost: idr(0.02),
    };
    const stock: InventoryStockBalance = {
      ingredientId: "rice",
      outletId: "wm-1",
      quantity: 900,
      updatedAt: "2026-07-20T05:00:00.000Z",
    };
    const movement = (id: string, occurredAt: string, delta: number): InventoryMovement => ({
      id,
      ingredientId: "rice",
      outletId: "wm-1",
      type: "consumption",
      quantity: Math.abs(delta),
      unit: "g",
      baseQuantityDelta: delta,
      unitCost: idr(0.02),
      referenceId: null,
      note: "",
      occurredAt,
    });
    const rows = buildInventoryUsage(
      snapshot({
        ingredients: [ingredient],
        stockBalances: [stock],
        inventoryMovements: [
          movement("inside", "2026-07-20T03:00:00.000Z", -250),
          movement("outside", "2026-07-18T03:00:00.000Z", -500),
        ],
      }),
    );

    expect(rows).toEqual([
      expect.objectContaining({
        ingredientId: "rice",
        quantityUsed: 250,
        estimatedUsageValue: idr(5),
        currentStock: 900,
        lowStock: true,
      }),
    ]);
  });

  it("does not mutate input arrays while building reports", () => {
    const source = snapshot({
      menuItems: [menu("menu-1", "Gado-gado")],
      orders: [order("order-1", [orderItem("menu-1", "Gado-gado")])],
      financeTransactions: [sale("sale-1", "order-1")],
    });
    const original = structuredClone(source);

    buildMenuPerformance(source);
    buildCategoryPerformance(source);
    buildPeakSalesHours(source);
    buildInventoryUsage(source);

    expect(source).toEqual(original);
  });
});
