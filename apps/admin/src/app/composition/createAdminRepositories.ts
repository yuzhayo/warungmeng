import {
  bindDashboardRepositories,
  bindUnavailableDashboardRepositories,
  type DashboardRepositoriesPort,
} from "../../features/dashboard";
import { financeRepository } from "../../features/finance/application/financeRepository";
import { inventoryRepository } from "../../features/inventory/application/inventoryRepository";
import { menuCatalogRepository } from "../../features/menu/application/menuCatalogRepository";
import { orderRepository } from "../../features/orders/application/orderRepository";

export interface AdminRepositories {
  readonly dashboard: DashboardRepositoriesPort;
}

export function createAdminRepositories(): AdminRepositories {
  return {
    dashboard: {
      orders: orderRepository,
      finance: financeRepository,
      inventory: inventoryRepository,
      catalog: menuCatalogRepository,
    },
  };
}

export function bindAdminRepositories(repositories: AdminRepositories): () => void {
  return bindDashboardRepositories(repositories.dashboard);
}

export function bindUnavailableAdminRepositories(): () => void {
  return bindUnavailableDashboardRepositories("Required Dashboard module startup failed.");
}
