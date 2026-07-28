import { afterEach, describe, expect, it } from "vitest";
import { menuCatalogRepository } from "../../features/menu/application/menuCatalogRepository";
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
  it("owns one instance of each repository plus the atomic transaction, shared with Dashboard", () => {
    const repositories = createAdminRepositories();

    expect(repositories.orders).toBeDefined();
    expect(repositories.finance).toBeDefined();
    expect(repositories.inventory).toBeDefined();
    expect(repositories.menuCatalog).toBeDefined();
    expect(repositories.atomicTransaction).toBeDefined();

    // Dashboard observes those exact same instances (strict identity).
    expect(repositories.dashboard.orders).toBe(repositories.orders);
    expect(repositories.dashboard.finance).toBe(repositories.finance);
    expect(repositories.dashboard.inventory).toBe(repositories.inventory);
    expect(repositories.dashboard.catalog).toBe(repositories.menuCatalog);
  });

  it("creates independent repository and transaction instances per composition root", () => {
    const first = createAdminRepositories();
    const second = createAdminRepositories();

    expect(first.orders).not.toBe(second.orders);
    expect(first.finance).not.toBe(second.finance);
    expect(first.inventory).not.toBe(second.inventory);
    expect(first.menuCatalog).not.toBe(second.menuCatalog);
    expect(first.atomicTransaction).not.toBe(second.atomicTransaction);
  });

  it("gives the atomic transaction ownership of the exact Order and Inventory instances", async () => {
    const repositories = createAdminRepositories();
    const before = await repositories.orders.getOrderById("order-1008");
    expect(before).toMatchObject({ status: "new" });

    // A failing transaction must roll back mutations performed through the
    // composition-owned repositories — proving the transaction owns these
    // exact resources rather than private copies.
    await expect(
      repositories.atomicTransaction.run(async () => {
        await repositories.orders.updateOrderStatus("order-1008", "cancelled");
        throw new Error("forced failure");
      }),
    ).rejects.toThrow("forced failure");

    await expect(repositories.orders.getOrderById("order-1008")).resolves.toMatchObject({
      status: "new",
      paymentStatus: "paid",
    });
  });

  it("routes the menu compatibility export to the active runtime's owned instance", async () => {
    const repositories = createAdminRepositories();
    track(bindAdminRepositories(repositories));

    const created = await repositories.menuCatalog.createCategory({
      name: "composition-probe",
      slug: "composition-probe",
      visibility: "hidden",
      sortOrder: 999,
    });
    const seenThroughExport = await menuCatalogRepository.getCategoryById(created.id);
    expect(seenThroughExport?.name).toBe("composition-probe");
  });

  it("keeps separate roots isolated across the menu compatibility export", async () => {
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

  it("keeps the menu compatibility path usable when the Dashboard degrades", async () => {
    const repositories = createAdminRepositories();
    // Degraded startup: only Dashboard reporting becomes unavailable; Menu
    // screens must still resolve real composition-owned data.
    track(bindUnavailableAdminRepositories(repositories));

    const category = await menuCatalogRepository.createCategory({
      name: "degraded-probe",
      slug: "degraded-probe",
      visibility: "hidden",
      sortOrder: 997,
    });
    expect(category.id).toBeTruthy();
    const seen = await repositories.menuCatalog.getCategoryById(category.id);
    expect(seen?.name).toBe("degraded-probe");
  });

  it("resolves the menu export to a usable default instance while unbound", async () => {
    await expect(menuCatalogRepository.listCategories()).resolves.toBeInstanceOf(Array);

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
