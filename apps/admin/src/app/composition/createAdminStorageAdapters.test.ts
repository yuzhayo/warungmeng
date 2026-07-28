import { describe, expect, it } from "vitest";
import {
  createInitialPosCashierState,
  PosSessionStore,
  type PosCashierState,
} from "../../features/pos/application/posSessionStore";
import { POS_OUTLETS } from "../../features/pos/application/posFixtures";
import { serializePosCashierState } from "../../features/pos/application/posSessionPersistence";
import {
  createAdminStorageAdapters,
  createBrowserPosSessionStorageAdapter,
  createMemoryPosSessionStorageAdapter,
  POS_SESSION_STORAGE_KEY,
} from "./createAdminStorageAdapters";

const outlet = POS_OUTLETS[0]!;

function createFakeWebStorage(initial: Record<string, string> = {}) {
  const entries = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => {
      entries.set(key, value);
    },
    removeItem: (key: string) => {
      entries.delete(key);
    },
    entries,
  };
}

function openSessionState(): PosCashierState {
  const initial = createInitialPosCashierState(outlet);
  return {
    ...initial,
    session: {
      status: "open",
      outlet,
      openingBalance: { amount: 100_000, currency: "IDR" },
      openedAt: "2026-07-19T08:00:00.000Z",
    },
    openingBalance: 100_000,
    pendingInventorySyncs: [{ orderId: "order-77", orderNumber: "WM-POS-77" }],
    processing: true,
    cashSales: 55_000,
    sequence: 4,
  };
}

describe("createAdminStorageAdapters", () => {
  it("persists under the locked v1 key and restores with processing reset to false", () => {
    const webStorage = createFakeWebStorage();
    const adapter = createBrowserPosSessionStorageAdapter(webStorage);

    adapter.save(openSessionState());

    expect(webStorage.entries.has(POS_SESSION_STORAGE_KEY)).toBe(true);
    expect(POS_SESSION_STORAGE_KEY).toBe("warungmeng.admin.pos-session.v1");

    const restored = adapter.load();
    expect(restored).toMatchObject({
      session: { status: "open" },
      openingBalance: 100_000,
      pendingInventorySyncs: [{ orderId: "order-77", orderNumber: "WM-POS-77" }],
      processing: false,
      cashSales: 55_000,
      sequence: 4,
    });
  });

  it("returns null for missing, corrupt, and version-mismatched payloads without throwing", () => {
    const empty = createBrowserPosSessionStorageAdapter(createFakeWebStorage());
    expect(empty.load()).toBeNull();

    const corrupt = createBrowserPosSessionStorageAdapter(
      createFakeWebStorage({ [POS_SESSION_STORAGE_KEY]: "{not valid json" }),
    );
    expect(corrupt.load()).toBeNull();

    const wrongShape = createBrowserPosSessionStorageAdapter(
      createFakeWebStorage({
        [POS_SESSION_STORAGE_KEY]: JSON.stringify({ version: 1, state: {} }),
      }),
    );
    expect(wrongShape.load()).toBeNull();

    const futureVersion = createBrowserPosSessionStorageAdapter(
      createFakeWebStorage({
        [POS_SESSION_STORAGE_KEY]: serializePosCashierState(openSessionState()).replace(
          '"version":1',
          '"version":2',
        ),
      }),
    );
    expect(futureVersion.load()).toBeNull();
  });

  it("swallows storage write and clear failures instead of crashing checkout flows", () => {
    const adapter = createBrowserPosSessionStorageAdapter({
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    });

    expect(() => adapter.save(openSessionState())).not.toThrow();
    expect(() => adapter.clear()).not.toThrow();
    expect(adapter.load()).toBeNull();
  });

  it("gives the memory adapter the same round-trip and clear semantics", () => {
    const adapter = createMemoryPosSessionStorageAdapter();
    expect(adapter.load()).toBeNull();

    adapter.save(openSessionState());
    expect(adapter.load()).toMatchObject({ session: { status: "open" }, processing: false });

    adapter.clear();
    expect(adapter.load()).toBeNull();
  });

  it("backs a store so a remounted store restores the session and a corrupt payload closes it", () => {
    const storage = createMemoryPosSessionStorageAdapter();
    const first = new PosSessionStore(outlet, storage);
    first.update(() => openSessionState());

    const restored = new PosSessionStore(outlet, storage);
    expect(restored.getState()).toMatchObject({
      session: { status: "open" },
      processing: false,
      sequence: 4,
    });

    storage.clear();
    const clean = new PosSessionStore(outlet, storage);
    expect(clean.getState()).toMatchObject({
      session: { status: "closed" },
      items: [],
      sequence: 1,
    });
  });

  it("prefers the provided web storage and falls back to memory when none exists", () => {
    const webStorage = createFakeWebStorage();
    const adapters = createAdminStorageAdapters({ sessionStorage: webStorage });
    adapters.posSessionStorage.save(openSessionState());
    expect(webStorage.entries.has(POS_SESSION_STORAGE_KEY)).toBe(true);

    const fallback = createAdminStorageAdapters({});
    expect(fallback.posSessionStorage.load()).toBeNull();
    expect(() => fallback.posSessionStorage.save(openSessionState())).not.toThrow();
  });

  it("falls back to memory when the browser sessionStorage getter is blocked", () => {
    const descriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("sessionStorage access blocked");
      },
    });

    try {
      const fallback = createAdminStorageAdapters();
      expect(fallback.posSessionStorage.load()).toBeNull();
      expect(() => fallback.posSessionStorage.save(openSessionState())).not.toThrow();
    } finally {
      if (descriptor) Object.defineProperty(window, "sessionStorage", descriptor);
    }
  });
});
