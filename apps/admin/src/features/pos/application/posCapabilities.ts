import type { PosCatalogPort } from "./ports/posCatalogPort";
import type { PosCheckoutPort } from "./ports/posCheckoutPort";
import type { PosSessionStore } from "./posSessionStore";

/**
 * Session surface published as `pos.session`: the storage-backed store whose
 * state survives route remounts and reloads for one Admin runtime.
 */
export interface PosSessionCapability {
  readonly store: PosSessionStore;
}

/** Cart/catalog surface published as `pos.cart`. */
export interface PosCartCapability {
  readonly catalog: PosCatalogPort;
}

/** Checkout surface published as `pos.checkout` with pending-sync semantics. */
export type PosCheckoutCapability = PosCheckoutPort;
