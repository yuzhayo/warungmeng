import type { InventoryMovementType } from "@warungmeng/domain";

export const INVENTORY_OUTLETS = [
  { id: "wm-1", nameKey: "inventory.outlet.wm1" as const },
  { id: "wm-2", nameKey: "inventory.outlet.wm2" as const },
] as const;

export const INVENTORY_MOVEMENT_TYPES: readonly InventoryMovementType[] = [
  "purchase",
  "consumption",
  "adjustment-in",
  "adjustment-out",
  "waste",
];
