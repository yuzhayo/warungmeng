import type { InventoryMovement, Order } from "@warungmeng/domain";

/**
 * Narrow inventory port for cancellation: only the idempotent reversal of the
 * cancelled order's recorded consumption. The composition-owned Inventory
 * repository satisfies this structurally.
 */
export interface InventoryReversalPort {
  revertOrderConsumption(order: Order): Promise<readonly InventoryMovement[]>;
}
