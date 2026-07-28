import type { PosCashierState } from "./posSessionStore";

export const POS_SESSION_PAYLOAD_VERSION = 1;

interface PersistedPosSessionEnvelope {
  readonly version: typeof POS_SESSION_PAYLOAD_VERSION;
  readonly state: PosCashierState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPosCashierStateShape(value: unknown): value is PosCashierState {
  if (!isRecord(value)) return false;
  const { session, selectedOutlet, checkout, pendingInventorySyncs } = value;
  return (
    isRecord(session) &&
    (session.status === "open" || session.status === "closed") &&
    isRecord(selectedOutlet) &&
    typeof selectedOutlet.id === "string" &&
    typeof selectedOutlet.name === "string" &&
    typeof value.openingBalance === "number" &&
    Array.isArray(value.items) &&
    isRecord(checkout) &&
    isRecord(checkout.pricing) &&
    (value.receipt === null || isRecord(value.receipt)) &&
    Array.isArray(pendingInventorySyncs) &&
    pendingInventorySyncs.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.orderId === "string" &&
        typeof entry.orderNumber === "string",
    ) &&
    typeof value.cashSales === "number" &&
    Number.isInteger(value.sequence) &&
    (value.sequence as number) >= 1 &&
    (value.lastCloseRecord === null || isRecord(value.lastCloseRecord))
  );
}

/** Serializes the full cashier state under a versioned envelope. */
export function serializePosCashierState(state: PosCashierState): string {
  const envelope: PersistedPosSessionEnvelope = { version: POS_SESSION_PAYLOAD_VERSION, state };
  return JSON.stringify(envelope);
}

/**
 * Restores a persisted payload. Transient `processing` always comes back as
 * `false`; a corrupt or version-mismatched payload yields null so the caller
 * starts from a clean closed session instead of throwing.
 */
export function deserializePosCashierState(raw: string): PosCashierState | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== POS_SESSION_PAYLOAD_VERSION) return null;
    if (!isPosCashierStateShape(parsed.state)) return null;
    return { ...parsed.state, processing: false };
  } catch {
    return null;
  }
}
