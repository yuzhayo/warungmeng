import { describe, expect, it } from "vitest";
import type { PosCartItem } from "./types";
import {
  calculatePosChange,
  calculatePosItemLineTotal,
  calculatePosItemUnitPrice,
  calculatePosTotals,
  isPosPaymentSufficient,
} from "./pricing";

const item: PosCartItem = {
  id: "cart-1",
  menuItemId: "menu-1",
  name: "GADO-GADO",
  unitPrice: { amount: 22_000, currency: "IDR" },
  variantSelections: [
    {
      groupId: "portion",
      groupName: "Porsi",
      optionId: "large",
      optionName: "Besar",
      priceAdjustment: { amount: 4_000, currency: "IDR" },
    },
  ],
  quantity: 2,
  note: "",
};

describe("POS pricing", () => {
  it("includes variant adjustments in unit and line totals", () => {
    expect(calculatePosItemUnitPrice(item)).toBe(26_000);
    expect(calculatePosItemLineTotal(item)).toBe(52_000);
  });

  it("calculates discount, service charge, tax, rounding, and total deterministically", () => {
    expect(
      calculatePosTotals([item], {
        discountAmount: 2_000,
        serviceChargeAmount: 1_000,
        taxRate: 0.1,
        roundingStep: 100,
      }),
    ).toEqual({
      subtotal: { amount: 52_000, currency: "IDR" },
      discount: { amount: 2_000, currency: "IDR" },
      serviceCharge: { amount: 1_000, currency: "IDR" },
      tax: { amount: 5_100, currency: "IDR" },
      rounding: { amount: 0, currency: "IDR" },
      total: { amount: 56_100, currency: "IDR" },
    });
  });

  it("clamps invalid pricing inputs and calculates cash change", () => {
    const totals = calculatePosTotals([item], {
      discountAmount: 99_999,
      serviceChargeAmount: -100,
      taxRate: 5,
      roundingStep: 0,
    });
    expect(totals.total.amount).toBe(0);
    expect(calculatePosChange(56_100, 60_000)).toBe(3_900);
    expect(isPosPaymentSufficient(56_100, 56_000)).toBe(false);
    expect(isPosPaymentSufficient(56_100, 60_000)).toBe(true);
  });
});
