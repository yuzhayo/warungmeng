import type { Money } from "../catalog/types";
import type { OrderTotals } from "../orders/types";
import type { PosCartItem, PosPricingOptions } from "./types";

function money(amount: number): Money {
  return { amount, currency: "IDR" };
}

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

export function calculatePosItemUnitPrice(item: PosCartItem): number {
  return (
    item.unitPrice.amount +
    item.variantSelections.reduce((total, selection) => total + selection.priceAdjustment.amount, 0)
  );
}

export function calculatePosItemLineTotal(item: PosCartItem): number {
  return calculatePosItemUnitPrice(item) * item.quantity;
}

export function calculatePosTotals(
  items: readonly PosCartItem[],
  options: PosPricingOptions,
): OrderTotals {
  const subtotal = items.reduce((total, item) => total + calculatePosItemLineTotal(item), 0);
  const discount = Math.min(nonNegativeInteger(options.discountAmount), subtotal);
  const serviceCharge = nonNegativeInteger(options.serviceChargeAmount);
  const taxRate = Number.isFinite(options.taxRate) ? Math.min(Math.max(options.taxRate, 0), 1) : 0;
  const taxableAmount = subtotal - discount + serviceCharge;
  const tax = Math.round(taxableAmount * taxRate);
  const beforeRounding = taxableAmount + tax;
  const roundingStep = nonNegativeInteger(options.roundingStep);
  const roundedTotal =
    roundingStep > 1 ? Math.round(beforeRounding / roundingStep) * roundingStep : beforeRounding;
  const rounding = roundedTotal - beforeRounding;

  return {
    subtotal: money(subtotal),
    discount: money(discount),
    tax: money(tax),
    serviceCharge: money(serviceCharge),
    rounding: money(rounding),
    total: money(roundedTotal),
  };
}

export function calculatePosChange(total: number, cashReceived: number): number {
  return Math.max(0, nonNegativeInteger(cashReceived) - nonNegativeInteger(total));
}

export function isPosPaymentSufficient(total: number, cashReceived: number): boolean {
  return nonNegativeInteger(cashReceived) >= nonNegativeInteger(total);
}
