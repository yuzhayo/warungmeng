import type { PosCheckoutDraft } from "@warungmeng/domain";

export const DEFAULT_POS_CHECKOUT: PosCheckoutDraft = {
  fulfillment: "dine-in",
  paymentMethod: "cash",
  cashReceived: 0,
  pricing: {
    discountAmount: 0,
    serviceChargeAmount: 0,
    taxRate: 0.1,
    roundingStep: 100,
  },
};

export function createPosOrderNumber(now: Date, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new RangeError("sequence must be a positive integer");
  }

  const datePart = [
    now.getFullYear().toString().slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const timePart = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  return `WM-POS-${datePart}-${timePart}-${String(sequence).padStart(3, "0")}`;
}
