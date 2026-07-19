import type { Money } from "../catalog/types";

export type InventoryUnit = "g" | "kg" | "ml" | "l" | "piece" | "portion";
export type InventoryIngredientStatus = "active" | "archived";
export type InventoryMovementType =
  "purchase" | "consumption" | "adjustment-in" | "adjustment-out" | "waste";

export interface InventorySupplier {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
}

export interface InventoryIngredient {
  readonly id: string;
  readonly name: string;
  readonly baseUnit: InventoryUnit;
  readonly supplierId: string | null;
  readonly status: InventoryIngredientStatus;
  readonly minimumStock: number;
  readonly lastPurchaseUnitCost: Money;
  readonly averageUnitCost: Money;
}

export interface InventoryStockBalance {
  readonly ingredientId: string;
  readonly outletId: string;
  readonly quantity: number;
  readonly updatedAt: string;
}

export interface InventoryMovement {
  readonly id: string;
  readonly ingredientId: string;
  readonly outletId: string;
  readonly type: InventoryMovementType;
  readonly quantity: number;
  readonly unit: InventoryUnit;
  readonly baseQuantityDelta: number;
  readonly unitCost: Money | null;
  readonly referenceId: string | null;
  readonly note: string;
  readonly occurredAt: string;
}

export interface RecipeComponent {
  readonly id: string;
  readonly ingredientId: string;
  readonly quantity: number;
  readonly unit: InventoryUnit;
  readonly wastePercentage: number;
}

export interface MenuRecipe {
  readonly menuItemId: string;
  readonly components: readonly RecipeComponent[];
  readonly packagingCost: Money;
  readonly additionalCost: Money;
  readonly updatedAt: string;
}

export interface RecipeIngredientCost {
  readonly ingredientId: string;
  readonly baseQuantity: number;
  readonly cost: Money;
}

export interface MenuHppBreakdown {
  readonly menuItemId: string;
  readonly ingredientCosts: readonly RecipeIngredientCost[];
  readonly ingredientTotal: Money;
  readonly packagingCost: Money;
  readonly additionalCost: Money;
  readonly total: Money;
}
