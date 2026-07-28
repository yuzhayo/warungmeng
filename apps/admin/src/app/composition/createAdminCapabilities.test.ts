import { describe, expect, it } from "vitest";
import { createAdminCapabilities, type AdminCapabilities } from "./createAdminCapabilities";
import { createAdminRepositories, type AdminRepositories } from "./createAdminRepositories";
import { createMemoryPosSessionStorageAdapter } from "./createAdminStorageAdapters";

function createHarness(): {
  readonly repositories: AdminRepositories;
  readonly capabilities: AdminCapabilities;
} {
  const repositories = createAdminRepositories();
  const capabilities = createAdminCapabilities({
    repositories,
    storage: { posSessionStorage: createMemoryPosSessionStorageAdapter() },
  });
  return { repositories, capabilities };
}

describe("createAdminCapabilities", () => {
  it("exposes the exact composition-owned instances through structural capabilities", () => {
    const { repositories, capabilities } = createHarness();

    // Structural Pick<> capabilities are the repository objects themselves —
    // no wrapper classes, no second instances.
    expect(capabilities.catalog).toBe(repositories.menuCatalog);
    expect(capabilities.orders.read).toBe(repositories.orders);
    expect(capabilities.inventory.read).toBe(repositories.inventory);
    expect(capabilities.inventory.adjust).toBe(repositories.inventory);
    expect(capabilities.inventory.consume).toBe(repositories.inventory);
    expect(capabilities.inventory.reverse).toBe(repositories.inventory);
    expect(capabilities.finance.record).toBe(repositories.finance);
    expect(capabilities.pos.cart.catalog).toBe(capabilities.catalog);
  });

  it("projects refunds deterministically from a settled order without persisting anything", async () => {
    const { repositories, capabilities } = createHarness();
    const manualBefore = await repositories.finance.listManualTransactions();

    const outcome = await capabilities.orders.manage.cancel("order-1008");
    expect(outcome).toMatchObject({ status: "cancelled", refunded: true });
    if (outcome.status !== "cancelled") throw new Error("expected cancelled outcome");

    const firstProjection = capabilities.finance.refund.projectRefund(outcome.order);
    const secondProjection = capabilities.finance.refund.projectRefund(outcome.order);

    // Deterministic: the same settled order yields the same refund identity.
    expect(firstProjection.length).toBeGreaterThan(0);
    expect(secondProjection).toEqual(firstProjection);
    expect(firstProjection.every((transaction) => transaction.type === "refund")).toBe(true);

    // No fake persisted refund write: manual finance data is untouched.
    await expect(repositories.finance.listManualTransactions()).resolves.toEqual(manualBefore);
  });

  it("routes orders.manage through the composition-owned repositories atomically", async () => {
    const { repositories, capabilities } = createHarness();

    const updated = await capabilities.orders.manage.updateStatus("order-1007", "preparing");
    expect(updated).toMatchObject({ status: "updated", order: { status: "preparing" } });
    await expect(repositories.orders.getOrderById("order-1007")).resolves.toMatchObject({
      status: "preparing",
    });

    const cancelled = await capabilities.orders.manage.cancel("order-1008");
    expect(cancelled).toMatchObject({ status: "cancelled", refunded: true });
    await expect(repositories.orders.getOrderById("order-1008")).resolves.toMatchObject({
      status: "cancelled",
      paymentStatus: "refunded",
    });

    // Idempotent retry: rejected as invalid transition, nothing mutates.
    await expect(capabilities.orders.manage.cancel("order-1008")).resolves.toMatchObject({
      status: "invalid-transition",
    });

    // Unpaid cancellation settles no refund.
    await expect(capabilities.orders.manage.cancel("order-1006")).resolves.toMatchObject({
      status: "cancelled",
      refunded: false,
    });
  });

  it("keeps POS checkout on persisted-order-plus-consumption semantics against the shared repositories", async () => {
    const { repositories, capabilities } = createHarness();
    const seed = await repositories.orders.getOrderById("order-1007");
    expect(seed).not.toBeNull();
    const { id: _ignored, ...input } = seed!;

    const created = await capabilities.pos.checkout.createOrder({
      ...input,
      orderNumber: "WM-POS-CAP-001",
    });

    // The persisted order is visible through the same composition-owned
    // Order repository — one instance, not a POS-private copy.
    await expect(repositories.orders.getOrderById(created.id)).resolves.toMatchObject({
      orderNumber: "WM-POS-CAP-001",
    });
    await expect(capabilities.pos.checkout.getOrderById(created.id)).resolves.toMatchObject({
      orderNumber: "WM-POS-CAP-001",
    });

    // Consumption goes through the shared Inventory instance and stays
    // idempotent by order id.
    const first = await capabilities.pos.checkout.consumeOrder(created);
    const repeat = await capabilities.pos.checkout.consumeOrder(created);
    expect(repeat).toEqual(first);
  });

  it("gives each capability set its own storage-backed POS session store", () => {
    const storage = createMemoryPosSessionStorageAdapter();
    const repositories = createAdminRepositories();
    const capabilities = createAdminCapabilities({
      repositories,
      storage: { posSessionStorage: storage },
    });

    const store = capabilities.pos.session.store;
    store.update((current) => ({ ...current, openingBalance: 250_000 }));

    // State persisted through the provided adapter and restored by a new
    // capability set over the same storage (reload semantics).
    const restoredSet = createAdminCapabilities({
      repositories: createAdminRepositories(),
      storage: { posSessionStorage: storage },
    });
    expect(restoredSet.pos.session.store.getState()).toMatchObject({
      openingBalance: 250_000,
      processing: false,
    });
  });

  it("isolates separate composition roots completely", async () => {
    const first = createHarness();
    const second = createHarness();

    expect(first.capabilities.orders.read).not.toBe(second.capabilities.orders.read);
    expect(first.capabilities.pos.session.store).not.toBe(second.capabilities.pos.session.store);

    await first.capabilities.orders.manage.cancel("order-1008");
    await expect(second.repositories.orders.getOrderById("order-1008")).resolves.toMatchObject({
      status: "new",
    });

    first.capabilities.pos.session.store.update((current) => ({
      ...current,
      openingBalance: 99_000,
    }));
    expect(second.capabilities.pos.session.store.getState().openingBalance).toBe(0);
  });
});
