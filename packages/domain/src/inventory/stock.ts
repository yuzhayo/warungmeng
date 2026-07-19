import { convertInventoryQuantity } from "./units";
import type {
  InventoryIngredient,
  InventoryMovementType,
  InventoryStockBalance,
  InventoryUnit,
} from "./types";

export interface StockMovementDraft {
  readonly type: InventoryMovementType;
  readonly quantity: number;
  readonly unit: InventoryUnit;
}

const OUTBOUND_TYPES: readonly InventoryMovementType[] = ["consumption", "adjustment-out", "waste"];

export function calculateMovementBaseDelta(
  ingredient: InventoryIngredient,
  movement: StockMovementDraft,
): number {
  const baseQuantity = convertInventoryQuantity(
    movement.quantity,
    movement.unit,
    ingredient.baseUnit,
  );
  return OUTBOUND_TYPES.includes(movement.type) ? -baseQuantity : baseQuantity;
}

export function applyStockDelta(
  balance: InventoryStockBalance,
  baseQuantityDelta: number,
  allowNegativeStock = false,
): InventoryStockBalance {
  if (!Number.isFinite(baseQuantityDelta)) {
    throw new RangeError("Stock delta must be finite");
  }

  const quantity = balance.quantity + baseQuantityDelta;
  if (!allowNegativeStock && quantity < 0) {
    throw new RangeError("Stock movement would create a negative balance");
  }

  return { ...balance, quantity };
}

export function isLowStock(
  ingredient: InventoryIngredient,
  balance: InventoryStockBalance,
): boolean {
  return balance.quantity <= ingredient.minimumStock;
}
