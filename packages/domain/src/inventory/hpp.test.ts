import { describe, expect, it } from "vitest";
import type { InventoryIngredient, MenuRecipe } from "./types";
import {
  calculateGrossMarginPercentage,
  calculateMenuHpp,
  calculateRecommendedSellingPrice,
} from "./hpp";

const ingredients: InventoryIngredient[] = [
  {
    id: "tea",
    name: "Tea",
    baseUnit: "g",
    supplierId: null,
    status: "active",
    minimumStock: 0,
    lastPurchaseUnitCost: { amount: 100, currency: "IDR" },
    averageUnitCost: { amount: 100, currency: "IDR" },
  },
];
const recipe: MenuRecipe = {
  menuItemId: "iced-tea",
  components: [
    { id: "component-1", ingredientId: "tea", quantity: 10, unit: "g", wastePercentage: 10 },
  ],
  packagingCost: { amount: 500, currency: "IDR" },
  additionalCost: { amount: 250, currency: "IDR" },
  updatedAt: "2026-07-19T00:00:00.000Z",
};

describe("inventory HPP", () => {
  it("calculates ingredient, waste, packaging, and additional costs", () => {
    const hpp = calculateMenuHpp(recipe, ingredients);
    expect(hpp.ingredientTotal.amount).toBe(1100);
    expect(hpp.total.amount).toBe(1850);
  });

  it("calculates gross margin percentage", () => {
    expect(calculateGrossMarginPercentage(10_000, 4000)).toBe(60);
    expect(calculateGrossMarginPercentage(0, 4000)).toBeNull();
  });

  it("recommends a selling price at the target margin rounded upward", () => {
    expect(calculateRecommendedSellingPrice(4100, 60, 500)).toBe(10_500);
  });

  it("rejects a missing ingredient", () => {
    expect(() => calculateMenuHpp(recipe, [])).toThrow(RangeError);
  });
});
