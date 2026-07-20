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
import { POS_OUTLETS } from "./posFixtures";

export interface PosCashierState {
  readonly session: PosSession;
  readonly selectedOutlet: PosOutlet;
  readonly openingBalance: number;
  readonly items: readonly PosCartItem[];
  readonly checkout: PosCheckoutDraft;
  readonly receipt: PosReceipt | null;
  readonly inventorySyncError: boolean;
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
    inventorySyncError: false,
    processing: false,
    cashSales: 0,
    sequence: 1,
    lastCloseRecord: null,
  };
}

/**
 * Session state lives outside React so an active cashier session survives
 * route unmount/remount. Screens subscribe through usePosCashier.
 */
export class PosSessionStore {
  #state: PosCashierState;
  readonly #listeners = new Set<() => void>();

  constructor(outlet: PosOutlet) {
    this.#state = createInitialPosCashierState(outlet);
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
    for (const listener of this.#listeners) listener();
  }
}

export const posSessionStore = new PosSessionStore(POS_OUTLETS[0]!);
