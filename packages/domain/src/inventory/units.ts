import type { InventoryUnit } from "./types";

type UnitDimension = "mass" | "volume" | "count";

const UNIT_DEFINITIONS: Record<
  InventoryUnit,
  { readonly dimension: UnitDimension; readonly canonicalFactor: number }
> = {
  g: { dimension: "mass", canonicalFactor: 1 },
  kg: { dimension: "mass", canonicalFactor: 1000 },
  ml: { dimension: "volume", canonicalFactor: 1 },
  l: { dimension: "volume", canonicalFactor: 1000 },
  piece: { dimension: "count", canonicalFactor: 1 },
  portion: { dimension: "count", canonicalFactor: 1 },
};

export const INVENTORY_UNITS = Object.freeze(Object.keys(UNIT_DEFINITIONS) as InventoryUnit[]);

export function areInventoryUnitsCompatible(source: InventoryUnit, target: InventoryUnit): boolean {
  return UNIT_DEFINITIONS[source].dimension === UNIT_DEFINITIONS[target].dimension;
}

export function convertInventoryQuantity(
  quantity: number,
  source: InventoryUnit,
  target: InventoryUnit,
): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new RangeError("Inventory quantity must be a finite non-negative number");
  }
  if (!areInventoryUnitsCompatible(source, target)) {
    throw new RangeError(`Cannot convert inventory unit ${source} to ${target}`);
  }

  return (
    (quantity * UNIT_DEFINITIONS[source].canonicalFactor) / UNIT_DEFINITIONS[target].canonicalFactor
  );
}
