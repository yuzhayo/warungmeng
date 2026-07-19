import { describe, expect, it } from "vitest";
import type { InventoryIngredient, InventoryStockBalance } from "./types";
import { applyStockDelta, calculateMovementBaseDelta, isLowStock } from "./stock";

const ingredient: InventoryIngredient = {
  id: "rice",
  name: "Rice",
  baseUnit: "g",
  supplierId: null,
  status: "active",
  minimumStock: 1000,
  lastPurchaseUnitCost: { amount: 0.02, currency: "IDR" },
  averageUnitCost: { amount: 0.02, currency: "IDR" },
};
const balance: InventoryStockBalance = {
  ingredientId: "rice",
  outletId: "wm-1",
  quantity: 1200,
  updatedAt: "2026-07-19T00:00:00.000Z",
};

describe("inventory stock", () => {
  it("creates a positive purchase delta in the base unit", () => {
    expect(
      calculateMovementBaseDelta(ingredient, { type: "purchase", quantity: 2, unit: "kg" }),
    ).toBe(2000);
  });

  it("creates a negative consumption delta", () => {
    expect(
      calculateMovementBaseDelta(ingredient, { type: "consumption", quantity: 250, unit: "g" }),
    ).toBe(-250);
  });

  it("rejects a negative resulting balance by default", () => {
    expect(() => applyStockDelta(balance, -1201)).toThrow(RangeError);
  });

  it("detects low stock at the configured threshold", () => {
    expect(isLowStock(ingredient, { ...balance, quantity: 1000 })).toBe(true);
    expect(isLowStock(ingredient, balance)).toBe(false);
  });
});
