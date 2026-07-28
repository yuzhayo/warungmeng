import type { PosSessionStoragePort } from "../../features/pos/application/ports/posSessionStoragePort";
import {
  deserializePosCashierState,
  serializePosCashierState,
} from "../../features/pos/application/posSessionPersistence";
import type { PosCashierState } from "../../features/pos/application/posSessionStore";

/** Storage key locked by Phase 04. Bump the suffix when the payload shape changes. */
export const POS_SESSION_STORAGE_KEY = "warungmeng.admin.pos-session.v1";

type WebStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface AdminStorageAdapters {
  readonly posSessionStorage: PosSessionStoragePort;
}

/**
 * sessionStorage-backed adapter. Storage failures (privacy mode, quota) and
 * unusable payloads never throw — they degrade to the clean closed-session
 * path the store already handles.
 */
export function createBrowserPosSessionStorageAdapter(storage: WebStorage): PosSessionStoragePort {
  return {
    load() {
      try {
        const raw = storage.getItem(POS_SESSION_STORAGE_KEY);
        return raw === null ? null : deserializePosCashierState(raw);
      } catch {
        return null;
      }
    },
    save(state: PosCashierState) {
      try {
        storage.setItem(POS_SESSION_STORAGE_KEY, serializePosCashierState(state));
      } catch {
        // Degrades to in-memory-only session behavior without crashing.
      }
    },
    clear() {
      try {
        storage.removeItem(POS_SESSION_STORAGE_KEY);
      } catch {
        // Nothing usable is stored, which is what clear wants anyway.
      }
    },
  };
}

/** Test double with the same versioned round-trip semantics as the browser adapter. */
export function createMemoryPosSessionStorageAdapter(): PosSessionStoragePort {
  let stored: string | null = null;
  return {
    load: () => (stored === null ? null : deserializePosCashierState(stored)),
    save(state: PosCashierState) {
      stored = serializePosCashierState(state);
    },
    clear() {
      stored = null;
    },
  };
}

export interface CreateAdminStorageAdaptersOptions {
  readonly sessionStorage?: WebStorage;
}

function resolveBrowserSessionStorage(): WebStorage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function createAdminStorageAdapters(
  options: CreateAdminStorageAdaptersOptions = {},
): AdminStorageAdapters {
  const storage = options.sessionStorage ?? resolveBrowserSessionStorage();
  return {
    posSessionStorage: storage
      ? createBrowserPosSessionStorageAdapter(storage)
      : createMemoryPosSessionStorageAdapter(),
  };
}
