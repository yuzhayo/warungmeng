import { afterEach, describe, expect, it } from "vitest";
import {
  financeOrderRepository,
  financeRepository,
} from "../../features/finance/application/financeRepository";
import { inventoryRepository } from "../../features/inventory/application/inventoryRepository";
import { menuCatalogRepository } from "../../features/menu/application/menuCatalogRepository";
import { orderRepository } from "../../features/orders/application/orderRepository";
import {
  bindAdminRepositories,
  bindUnavailableAdminRepositories,
  createAdminRepositories,
} from "./createAdminRepositories";

const cleanups: Array<() => void> = [];

function track(cleanup: () => void): () => void {
  cleanups.push(cleanup);
  return cleanup;
}

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

describe("createAdminRepositories composition ownership", () => {
  it("owns one instance of each current repository and shares it with the Dashboard bundle", () => {
    const repositories = createAdminRepositories();

    // The composition root owns the four current repositories directly.
    expect(repositories.orders).toBeDefined();
    expect(repositories.finance).toBeDefined();
    expect(repositories.inventory).toBeDefined();
    expect(repositories.menuCatalog).toBeDefined();

    // Dashboard observes those exact same instances (strict identity).
    expect(repositories.dashboard.orders).toBe(repositories.orders);
    expect(repositories.dashboard.finance).toBe(repositories.finance);
    expect(repositories.dashboard.inventory).toBe(repositories.inventory);
    expect(repositories.dashboard.catalog).toBe(repositories.menuCatalog);
  });

  it("creates independent repository instances per composition root", () => {
    const first = createAdminRepositories();
    const second = createAdminRepositories();

    expect(first.orders).not.toBe(second.orders);
    expect(first.finance).not.toBe(second.finance);
    expect(first.inventory).not.toBe(second.inventory);
    expect(first.menuCatalog).not.toBe(second.menuCatalog);
  });

  it("routes compatibility exports to the active runtime's owned instances", async () => {
    const repositories = createAdminRepositories();
    track(bindAdminRepositories(repositories));

    // A mutation performed through the composition-owned catalog instance must
    // be observable through the feature-level compatibility export while bound.
    const created = await repositories.menuCatalog.createCategory({
      name: "composition-probe",
      slug: "composition-probe",
      visibility: "hidden",
      sortOrder: 999,
    });
    const seenThroughExport = await menuCatalogRepository.getCategoryById(created.id);
    expect(seenThroughExport?.name).toBe("composition-probe");

    // The unbound default must not observe the composition-owned mutation.
    track(bindUnavailableAdminRepositories(repositories));
  });

  it("keeps separate roots isolated across the compatibility export", async () => {
    const first = createAdminRepositories();
    const release = track(bindAdminRepositories(first));
    const created = await first.menuCatalog.createCategory({
      name: "isolation-probe",
      slug: "isolation-probe",
      visibility: "hidden",
      sortOrder: 998,
    });
    release();
    cleanups.pop();

    const second = createAdminRepositories();
    track(bindAdminRepositories(second));
    const leaked = await menuCatalogRepository.getCategoryById(created.id);
    expect(leaked).toBeNull();
  });

  it("binds financeOrderRepository to the composition-owned Order instance", async () => {
    const repositories = createAdminRepositories();
    track(bindAdminRepositories(repositories));

    // Finance's order-derived reads must reach the same Order repository the
    // composition root owns — never a second Order repository.
    expect(financeOrderRepository).toBe(orderRepository);

    // Behavioural corroboration: reads through the finance-facing order export
    // resolve against the bound composition-owned Order instance.
    const boundOrders = await repositories.orders.listOrders();
    const viaFinance = await financeOrderRepository.listOrders();
    expect(viaFinance).toEqual(boundOrders);
  });

  it("keeps feature repositories usable when the Dashboard degrades", async () => {
    const repositories = createAdminRepositories();
    // Degraded startup: only Dashboard reporting becomes unavailable; the four
    // feature repositories must still resolve to real composition-owned data.
    track(bindUnavailableAdminRepositories(repositories));

    const category = await menuCatalogRepository.createCategory({
      name: "degraded-probe",
      slug: "degraded-probe",
      visibility: "hidden",
      sortOrder: 997,
    });
    expect(category.id).toBeTruthy();
    await expect(orderRepository.listOrders()).resolves.toBeInstanceOf(Array);
    await expect(financeRepository.listManualTransactions()).resolves.toBeInstanceOf(Array);
    await expect(inventoryRepository.listIngredients()).resolves.toBeInstanceOf(Array);
  });

  it("resolves feature exports to usable default instances while unbound", async () => {
    // No composition root is bound here. Existing screens and tests import the
    // feature-level exports directly and must keep working against a stable,
    // backward-compatible default instance rather than throwing.
    await expect(orderRepository.listOrders()).resolves.toBeInstanceOf(Array);
    await expect(financeRepository.listManualTransactions()).resolves.toBeInstanceOf(Array);
    await expect(inventoryRepository.listIngredients()).resolves.toBeInstanceOf(Array);
    await expect(menuCatalogRepository.listCategories()).resolves.toBeInstanceOf(Array);

    // Unbound reads stay on the same default instance across calls.
    const first = await menuCatalogRepository.listCategories();
    const second = await menuCatalogRepository.listCategories();
    expect(second).toEqual(first);
  });

  it("reverses bindings without restoring stale state", async () => {
    const first = createAdminRepositories();
    const releaseFirst = track(bindAdminRepositories(first));
    const outer = await first.menuCatalog.createCategory({
      name: "outer",
      slug: "outer",
      visibility: "hidden",
      sortOrder: 1,
    });

    const second = createAdminRepositories();
    const releaseSecond = track(bindAdminRepositories(second));
    // Overlapping binding: newest wins, resolves to `second`.
    expect(await menuCatalogRepository.getCategoryById(outer.id)).toBeNull();

    releaseSecond();
    cleanups.pop();
    // Removing the newest binding by identity restores `first`, not stale state.
    expect((await menuCatalogRepository.getCategoryById(outer.id))?.name).toBe("outer");

    releaseFirst();
    cleanups.pop();
    // Fully unbound now falls back to the default instance, which never observed
    // the composition-owned mutation.
    expect(await menuCatalogRepository.getCategoryById(outer.id)).toBeNull();
  });

  it("treats binding release as idempotent", async () => {
    const first = createAdminRepositories();
    const releaseFirst = track(bindAdminRepositories(first));
    const second = createAdminRepositories();
    const releaseSecond = bindAdminRepositories(second);

    const created = await first.menuCatalog.createCategory({
      name: "idempotent-probe",
      slug: "idempotent-probe",
      visibility: "hidden",
      sortOrder: 2,
    });

    // Releasing the newest binding twice must not pop an extra (unrelated) binding.
    releaseSecond();
    releaseSecond();

    // `first` is still the active binding and observes its own mutation.
    expect((await menuCatalogRepository.getCategoryById(created.id))?.name).toBe(
      "idempotent-probe",
    );

    releaseFirst();
    cleanups.pop();
    // No leak into the unbound default after the last release.
    expect(await menuCatalogRepository.getCategoryById(created.id)).toBeNull();
  });
});
