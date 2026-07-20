import type { DashboardReportRepositories } from "./dashboardReportData.core";
import { financeRepository } from "../../finance/application/financeRepository";
import { inventoryRepository } from "../../inventory/application/inventoryRepository";
import { menuCatalogRepository } from "../../menu/application/menuCatalogRepository";
import { orderRepository } from "../../orders/application/orderRepository";

/** Stable repository identities prevent dashboard reloads caused only by parent renders. */
export const dashboardRepositories: DashboardReportRepositories = {
  orders: orderRepository,
  finance: financeRepository,
  inventory: inventoryRepository,
  catalog: menuCatalogRepository,
};
