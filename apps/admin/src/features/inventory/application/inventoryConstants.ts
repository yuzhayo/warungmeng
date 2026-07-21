import type { InventoryMovementType } from "@warungmeng/domain";

// Admin is currently pinned to a single outlet; repository contracts keep
// outlet ids so a future multi-outlet rollout stays possible.
export const INVENTORY_OUTLET = { id: "wm-1", nameKey: "inventory.outlet.wm1" as const };

export const INVENTORY_MOVEMENT_TYPES: readonly InventoryMovementType[] = [
  "purchase",
  "consumption",
  "adjustment-in",
  "adjustment-out",
  "waste",
];
