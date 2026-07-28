import {
  createWarungMengOperationalDataRuntime,
  type AtomicDataTransaction,
  type WarungMengOperationalDataRuntime,
} from "@warungmeng/data";
import {
  bindDashboardRepositories,
  bindUnavailableDashboardRepositories,
  type DashboardRepositoriesPort,
} from "../../features/dashboard";
import { bindMenuCatalogRepository } from "../../features/menu/application/menuCatalogRepository";

export interface AdminRepositories {
  readonly orders: WarungMengOperationalDataRuntime["orders"];
  readonly finance: WarungMengOperationalDataRuntime["finance"];
  readonly inventory: WarungMengOperationalDataRuntime["inventory"];
  readonly menuCatalog: WarungMengOperationalDataRuntime["menuCatalog"];
  readonly atomicTransaction: AtomicDataTransaction;
  readonly dashboard: DashboardRepositoriesPort;
}

/**
 * The Admin composition root owns exactly one operational data runtime:
 * one instance of each repository plus the atomic transaction that owns the
 * same Order and Inventory resources. Dashboard observes those exact
 * instances, so the reporting port never reaches a second copy of any
 * repository.
 */
export function createAdminRepositories(): AdminRepositories {
  const runtime = createWarungMengOperationalDataRuntime();

  return {
    orders: runtime.orders,
    finance: runtime.finance,
    inventory: runtime.inventory,
    menuCatalog: runtime.menuCatalog,
    atomicTransaction: runtime.atomicTransaction,
    dashboard: {
      orders: runtime.orders,
      finance: runtime.finance,
      inventory: runtime.inventory,
      catalog: runtime.menuCatalog,
    },
  };
}

function composeRelease(releases: readonly (() => void)[]): () => void {
  let released = false;
  return () => {
    if (released) return;
    released = true;
    // Release in reverse order so the binding stacks unwind newest-first.
    for (let index = releases.length - 1; index >= 0; index -= 1) releases[index]?.();
  };
}

/**
 * Binds the remaining compatibility surfaces to the composition-owned
 * instances: the Menu catalog proxy (Menu screens are outside the Phase 04
 * behavioral cutover) and the Dashboard reporting port. Orders, Inventory,
 * and Finance no longer have module-level bindings — their consumers receive
 * capabilities through the runtime. The returned release reverses all
 * bindings and is idempotent.
 */
export function bindAdminRepositories(repositories: AdminRepositories): () => void {
  return composeRelease([
    bindMenuCatalogRepository(repositories.menuCatalog),
    bindDashboardRepositories(repositories.dashboard),
  ]);
}

/**
 * Degraded startup: the Menu catalog proxy stays bound to its real
 * composition-owned instance so Menu screens keep working, while only the
 * Dashboard reporting port resolves to an explicit unavailable error.
 */
export function bindUnavailableAdminRepositories(repositories: AdminRepositories): () => void {
  return composeRelease([
    bindMenuCatalogRepository(repositories.menuCatalog),
    bindUnavailableDashboardRepositories("Required Dashboard module startup failed."),
  ]);
}
