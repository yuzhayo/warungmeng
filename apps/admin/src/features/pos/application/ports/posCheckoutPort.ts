import type { CreateOrderInput } from "@warungmeng/data";
import type { InventoryMovement, Order } from "@warungmeng/domain";

/**
 * Checkout seam: persist the order, then consume stock. Deliberately NOT a
 * rollback transaction — a persisted order with failed consumption becomes a
 * pending inventory sync the cashier retries. `consumeOrder` is idempotent by
 * order id, and `getOrderById` serves the retry path.
 */
export interface PosCheckoutPort {
  createOrder(input: CreateOrderInput): Promise<Order>;
  getOrderById(id: string): Promise<Order | null>;
  consumeOrder(order: Order): Promise<readonly InventoryMovement[]>;
}
