import type { InventoryRepository } from "@warungmeng/data";

/** Read surface published as `inventory.read`. */
export type InventoryReadCapability = Pick<
  InventoryRepository,
  | "listIngredients"
  | "getIngredientById"
  | "listSuppliers"
  | "listStockBalances"
  | "listMovements"
  | "listRecipes"
  | "getRecipeByMenuItemId"
  | "calculateHpp"
>;

/** Mutation surface published as `inventory.adjust`. */
export type InventoryAdjustCapability = Pick<
  InventoryRepository,
  "createIngredient" | "updateIngredient" | "archiveIngredient" | "recordMovement" | "saveRecipe"
>;

/** Consumption surface published as `inventory.consume`; idempotent by order id. */
export type InventoryConsumeCapability = Pick<InventoryRepository, "consumeOrder">;

/** Reversal surface published as `inventory.reverse`; idempotent by order id. */
export type InventoryReverseCapability = Pick<InventoryRepository, "revertOrderConsumption">;
