import type { InventoryIngredient, MenuHppBreakdown, MenuRecipe } from "./types";
import { convertInventoryQuantity } from "./units";

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateMenuHpp(
  recipe: MenuRecipe,
  ingredients: readonly InventoryIngredient[],
): MenuHppBreakdown {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const ingredientCosts = recipe.components.map((component) => {
    const ingredient = ingredientById.get(component.ingredientId);
    if (!ingredient) {
      throw new RangeError(`Recipe ingredient ${component.ingredientId} was not found`);
    }
    if (component.wastePercentage < 0 || component.wastePercentage > 100) {
      throw new RangeError("Waste percentage must be between 0 and 100");
    }

    const baseQuantity = convertInventoryQuantity(
      component.quantity,
      component.unit,
      ingredient.baseUnit,
    );
    const cost = roundMoney(
      baseQuantity * ingredient.averageUnitCost.amount * (1 + component.wastePercentage / 100),
    );
    return {
      ingredientId: component.ingredientId,
      baseQuantity,
      cost: { amount: cost, currency: "IDR" as const },
    };
  });
  const ingredientTotal = roundMoney(
    ingredientCosts.reduce((total, item) => total + item.cost.amount, 0),
  );
  const total = roundMoney(
    ingredientTotal + recipe.packagingCost.amount + recipe.additionalCost.amount,
  );

  return {
    menuItemId: recipe.menuItemId,
    ingredientCosts,
    ingredientTotal: { amount: ingredientTotal, currency: "IDR" },
    packagingCost: { ...recipe.packagingCost },
    additionalCost: { ...recipe.additionalCost },
    total: { amount: total, currency: "IDR" },
  };
}

export function calculateGrossMarginPercentage(sellingPrice: number, hpp: number): number | null {
  if (sellingPrice <= 0) return null;
  return Math.round(((sellingPrice - hpp) / sellingPrice) * 10_000) / 100;
}

export function calculateRecommendedSellingPrice(
  hpp: number,
  targetMarginPercentage = 60,
  roundingStep = 500,
): number {
  if (hpp < 0 || targetMarginPercentage < 0 || targetMarginPercentage >= 100 || roundingStep <= 0) {
    throw new RangeError("Invalid recommended price parameters");
  }
  return Math.ceil(hpp / (1 - targetMarginPercentage / 100) / roundingStep) * roundingStep;
}
