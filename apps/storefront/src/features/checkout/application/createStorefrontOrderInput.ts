import { calculatePosItemLineTotal, calculatePosTotals } from "@warungmeng/domain";
import type { OrderItem } from "@warungmeng/domain";
import type { CreateOrderInput } from "@warungmeng/data";
import type { StorefrontCartItem } from "../../cart/application/storefrontCartModel";
import {
  isCheckoutDraftValid,
  normalizeCheckoutDraft,
  type StorefrontCheckoutDraft,
} from "./checkoutModel";

export interface CreateStorefrontOrderDependencies {
  readonly now: () => string;
  readonly createOrderNumber: () => string;
  readonly createEventId: () => string;
}

function createOrderItem(item: StorefrontCartItem): OrderItem {
  return {
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
  };
}

function hasValidCartAmounts(items: readonly StorefrontCartItem[]): boolean {
  return items.every(
    (item) =>
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      Number.isInteger(item.unitPrice.amount) &&
      item.unitPrice.amount >= 0 &&
      item.variantSelections.every(
        (selection) =>
          Number.isInteger(selection.priceAdjustment.amount) &&
          selection.priceAdjustment.amount >= 0,
      ) &&
      Number.isInteger(calculatePosItemLineTotal(item)) &&
      calculatePosItemLineTotal(item) >= 0,
  );
}

export function createStorefrontOrderInput(
  draft: StorefrontCheckoutDraft,
  cartItems: readonly StorefrontCartItem[],
  dependencies: CreateStorefrontOrderDependencies,
): CreateOrderInput {
  if (!isCheckoutDraftValid(draft)) throw new Error("Invalid storefront checkout draft");
  if (cartItems.length === 0) throw new Error("Cannot create an order from an empty cart");
  if (!hasValidCartAmounts(cartItems)) throw new Error("Invalid storefront cart amounts");

  const normalized = normalizeCheckoutDraft(draft);
  const createdAt = dependencies.now();
  const totals = calculatePosTotals(cartItems, {
    discountAmount: 0,
    serviceChargeAmount: 0,
    taxRate: 0,
    roundingStep: 0,
  });

  if (!Number.isInteger(totals.total.amount) || totals.total.amount < 0) {
    throw new Error("Invalid storefront order total");
  }

  return {
    orderNumber: dependencies.createOrderNumber(),
    outletId: "wm-1",
    outletName: "WARUNG MENG",
    channel: "storefront",
    fulfillment: "takeaway",
    paymentStatus: "unpaid",
    paymentMethod: "cash",
    status: "new",
    customer: { name: normalized.customerName, phone: normalized.customerPhone },
    items: cartItems.map(createOrderItem),
    totals,
    customerNote: normalized.customerNote,
    internalNote: "",
    createdAt,
    updatedAt: createdAt,
    events: [
      {
        id: dependencies.createEventId(),
        status: "new",
        occurredAt: createdAt,
        note: "",
      },
    ],
  };
}
