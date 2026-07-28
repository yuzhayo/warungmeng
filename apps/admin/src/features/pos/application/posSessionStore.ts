import {
  createClosedPosSession,
  type PosCartItem,
  type PosCheckoutDraft,
  type PosOutlet,
  type PosReceipt,
  type PosSession,
  type PosSessionCloseRecord,
} from "@warungmeng/domain";
import { DEFAULT_POS_CHECKOUT } from "./posCashierModel";
import type { PosSessionStoragePort } from "./ports/posSessionStoragePort";

export interface PosPendingInventorySync {
  readonly orderId: string;
  readonly orderNumber: string;
}

export interface PosCashierState {
  readonly session: PosSession;
  readonly selectedOutlet: PosOutlet;
  readonly openingBalance: number;
  readonly items: readonly PosCartItem[];
  readonly checkout: PosCheckoutDraft;
  readonly receipt: PosReceipt | null;
  readonly pendingInventorySyncs: readonly PosPendingInventorySync[];
  readonly processing: boolean;
  readonly cashSales: number;
  readonly sequence: number;
  readonly lastCloseRecord: PosSessionCloseRecord | null;
}

export function createInitialPosCashierState(outlet: PosOutlet): PosCashierState {
  return {
    session: createClosedPosSession(outlet),
    selectedOutlet: outlet,
    openingBalance: 0,
    items: [],
    checkout: DEFAULT_POS_CHECKOUT,
    receipt: null,
    pendingInventorySyncs: [],
    processing: false,
    cashSales: 0,
    sequence: 1,
    lastCloseRecord: null,
  };
}

/**
 * Session state lives outside React so an active cashier session survives
 * route unmount/remount, and — when a storage port is attached — reload.
 * Screens subscribe through usePosCashier. A corrupt or version-mismatched
 * persisted payload loads as null, so the store falls back to a clean closed
 * session.
 */
export class PosSessionStore {
  #state: PosCashierState;
  readonly #listeners = new Set<() => void>();
  readonly #storage: PosSessionStoragePort | undefined;

  constructor(outlet: PosOutlet, storage?: PosSessionStoragePort) {
    this.#storage = storage;
    this.#state = storage?.load() ?? createInitialPosCashierState(outlet);
  }

  getState = (): PosCashierState => this.#state;

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  update(updater: (current: PosCashierState) => PosCashierState): void {
    this.#state = updater(this.#state);
    this.#storage?.save(this.#state);
    for (const listener of this.#listeners) listener();
  }
}
