import {
  bindDashboardRepositories,
  bindUnavailableDashboardRepositories,
  type DashboardRepositoriesPort,
} from "../../features/dashboard";
import {
  bindFinanceRepository,
  createFinanceRepository,
  type FinanceRepositoryInstance,
} from "../../features/finance/application/financeRepository";
import {
  bindInventoryRepository,
  createInventoryRepository,
  type InventoryRepositoryInstance,
} from "../../features/inventory/application/inventoryRepository";
import {
  bindMenuCatalogRepository,
  createMenuCatalogRepository,
  type MenuCatalogRepositoryInstance,
} from "../../features/menu/application/menuCatalogRepository";
import {
  bindOrderRepository,
  createOrderRepository,
  type OrderRepositoryInstance,
} from "../../features/orders/application/orderRepository";

export interface AdminRepositories {
  readonly orders: OrderRepositoryInstance;
  readonly finance: FinanceRepositoryInstance;
  readonly inventory: InventoryRepositoryInstance;
  readonly menuCatalog: MenuCatalogRepositoryInstance;
  readonly dashboard: DashboardRepositoriesPort;
}

/**
 * The Admin composition root owns exactly one instance of each current
 * repository. Dashboard observes those exact instances, so the reporting port
 * never reaches a second copy of any repository.
 */
export function createAdminRepositories(): AdminRepositories {
  const orders = createOrderRepository();
  const finance = createFinanceRepository();
  const inventory = createInventoryRepository();
  const menuCatalog = createMenuCatalogRepository();

  return {
    orders,
    finance,
    inventory,
    menuCatalog,
    dashboard: {
      orders,
      finance,
      inventory,
      catalog: menuCatalog,
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
 * Binds every compatibility export to the composition-owned instances and the
 * Dashboard reporting port to the same objects. The returned release reverses
 * all bindings and is idempotent.
 */
export function bindAdminRepositories(repositories: AdminRepositories): () => void {
  return composeRelease([
    bindOrderRepository(repositories.orders),
    bindFinanceRepository(repositories.finance),
    bindInventoryRepository(repositories.inventory),
    bindMenuCatalogRepository(repositories.menuCatalog),
    bindDashboardRepositories(repositories.dashboard),
  ]);
}

/**
 * Degraded startup: the four feature repositories stay bound to their real
 * composition-owned instances so their screens keep working, while only the
 * Dashboard reporting port resolves to an explicit unavailable error.
 */
export function bindUnavailableAdminRepositories(repositories: AdminRepositories): () => void {
  return composeRelease([
    bindOrderRepository(repositories.orders),
    bindFinanceRepository(repositories.finance),
    bindInventoryRepository(repositories.inventory),
    bindMenuCatalogRepository(repositories.menuCatalog),
    bindUnavailableDashboardRepositories("Required Dashboard module startup failed."),
  ]);
}
