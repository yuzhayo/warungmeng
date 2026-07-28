import type { AtomicDataTransaction } from "../repositories/AtomicDataTransaction";
import type { InMemoryInventoryRepository } from "./InMemoryInventoryRepository";
import type { InMemoryOrderRepository } from "./InMemoryOrderRepository";

export interface InMemoryAtomicTransactionResources {
  readonly orders: InMemoryOrderRepository;
  readonly inventory: InMemoryInventoryRepository;
}

/**
 * In-memory transaction over the exact Order and Inventory instances the
 * composition root owns. `run` serializes overlapping operations so no second
 * callback observes a half-applied state, snapshots both targeted
 * repositories before the callback starts, restores both when the callback
 * rejects, and rethrows the original failure.
 */
export class InMemoryAtomicDataTransaction implements AtomicDataTransaction {
  readonly #resources: InMemoryAtomicTransactionResources;
  #queue: Promise<unknown> = Promise.resolve();

  constructor(resources: InMemoryAtomicTransactionResources) {
    this.#resources = resources;
  }

  run<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    const pending = this.#queue.then(() => this.#execute(operation));
    this.#queue = pending.then(
      () => undefined,
      () => undefined,
    );
    return pending;
  }

  async #execute<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    const orders = this.#resources.orders.captureSnapshot();
    const inventory = this.#resources.inventory.captureSnapshot();
    try {
      return await operation();
    } catch (error) {
      this.#resources.orders.restoreSnapshot(orders);
      this.#resources.inventory.restoreSnapshot(inventory);
      throw error;
    }
  }
}
