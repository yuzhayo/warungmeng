import type { ModuleCandidate } from "@warungmeng/module-system";
import { describe, expect, it } from "vitest";
import { createAdminCapabilities } from "../app/composition/createAdminCapabilities";
import { createAdminRepositories } from "../app/composition/createAdminRepositories";
import { createMemoryPosSessionStorageAdapter } from "../app/composition/createAdminStorageAdapters";
import { createAdminRuntime } from "../app/composition/createAdminRuntime";
import { createAdminModuleCandidates } from "../app/discovery/adminModuleCandidates";

function createHarness(
  overrideCandidates?: (candidates: readonly ModuleCandidate[]) => readonly ModuleCandidate[],
) {
  const repositories = createAdminRepositories();
  const capabilities = createAdminCapabilities({
    repositories,
    storage: { posSessionStorage: createMemoryPosSessionStorageAdapter() },
  });
  const candidates = createAdminModuleCandidates({ repositories, capabilities });
  const runtime = createAdminRuntime({
    repositories,
    capabilities,
    candidates: overrideCandidates ? overrideCandidates(candidates) : candidates,
  });
  return { repositories, capabilities, runtime };
}

describe("Admin capability runtime integration", () => {
  it("publishes every cluster capability slice with exact composition identity", async () => {
    const { capabilities, runtime } = createHarness();

    expect(runtime.capabilities).toEqual({});
    const snapshot = await runtime.initialize();
    expect(snapshot.status).toBe("ready");

    // The runtime bundle holds the exact objects composition assembled and
    // the extensions registered — not copies.
    expect(runtime.capabilities.catalog).toBe(capabilities.catalog);
    expect(runtime.capabilities.orders).toBe(capabilities.orders);
    expect(runtime.capabilities.inventory).toBe(capabilities.inventory);
    expect(runtime.capabilities.finance).toBe(capabilities.finance);
    expect(runtime.capabilities.pos).toBe(capabilities.pos);

    // Every cluster module actually registered — the module system enforces
    // that each manifest declaration was fulfilled by a real registration.
    for (const moduleId of [
      "admin.menu",
      "admin.orders",
      "admin.inventory",
      "admin.finance",
      "admin.pos",
    ] as const) {
      expect(runtime.registry.resolve(moduleId)).toBeDefined();
    }
  });

  it("clears capabilities on dispose and restores identical slices on reinitialize", async () => {
    const { capabilities, runtime } = createHarness();

    await runtime.initialize();
    expect(runtime.capabilities.orders).toBe(capabilities.orders);

    await runtime.dispose();
    expect(runtime.capabilities).toEqual({});
    expect(runtime.registry.list()).toEqual([]);

    // StrictMode-style re-entry: initialize again on the same runtime.
    const snapshot = await runtime.initialize();
    expect(snapshot.status).toBe("ready");
    expect(runtime.capabilities.orders).toBe(capabilities.orders);
    expect(runtime.capabilities.pos).toBe(capabilities.pos);
  });

  it("keeps repeated initialize calls idempotent", async () => {
    const { runtime } = createHarness();

    const [first, second] = await Promise.all([runtime.initialize(), runtime.initialize()]);
    expect(first.status).toBe("ready");
    expect(second.status).toBe("ready");
    expect(runtime.registry.list().map(({ id }) => id)).toContain("admin.orders");

    const third = await runtime.initialize();
    expect(third.status).toBe("ready");
  });

  it("withholds only the failing module's slice when its registration fails", async () => {
    const { capabilities, runtime } = createHarness((candidates) =>
      candidates.map((candidate) =>
        candidate.source === "admin.pos"
          ? {
              ...candidate,
              load: () => {
                throw new Error("POS module failed to load");
              },
            }
          : candidate,
      ),
    );

    const snapshot = await runtime.initialize();

    // Dashboard registered, so the runtime is ready; only POS is missing.
    expect(snapshot.status).toBe("ready");
    expect(runtime.capabilities.pos).toBeUndefined();
    expect(runtime.registry.resolve("admin.pos")).toBeUndefined();

    // Nothing else was taken down with it.
    expect(runtime.capabilities.catalog).toBe(capabilities.catalog);
    expect(runtime.capabilities.orders).toBe(capabilities.orders);
    expect(runtime.capabilities.inventory).toBe(capabilities.inventory);
    expect(runtime.capabilities.finance).toBe(capabilities.finance);
  });

  it("keeps separate Admin runtimes fully isolated", async () => {
    const first = createHarness();
    const second = createHarness();

    await first.runtime.initialize();
    await second.runtime.initialize();

    expect(first.runtime.capabilities.orders).not.toBe(second.runtime.capabilities.orders);
    expect(first.runtime.capabilities.pos?.session.store).not.toBe(
      second.runtime.capabilities.pos?.session.store,
    );

    // A cancellation in the first runtime never leaks into the second.
    await first.capabilities.orders.manage.cancel("order-1008");
    await expect(second.repositories.orders.getOrderById("order-1008")).resolves.toMatchObject({
      status: "new",
    });

    await first.runtime.dispose();
    // Disposing the first runtime leaves the second untouched.
    expect(second.runtime.capabilities.orders).toBe(second.capabilities.orders);
  });
});
