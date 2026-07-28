import type { PosCashierState } from "../posSessionStore";

/**
 * Explicit persistence seam for the cashier session. `load` returns null when
 * nothing usable is stored (missing, corrupt, or version mismatch) so the
 * caller falls back to a clean closed session. Implementations must never
 * throw on storage failures.
 */
export interface PosSessionStoragePort {
  load(): PosCashierState | null;
  save(state: PosCashierState): void;
  clear(): void;
}
