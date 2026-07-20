import type {
  FinanceRepository,
  InventoryRepository,
  MenuCatalogRepository,
  OrderRepository,
} from "@warungmeng/data";
import {
  buildFinanceLedger,
  sortFinanceTransactionsNewestFirst,
  type FinanceTransaction,
  type InventoryIngredient,
  type InventoryMovement,
  type InventoryStockBalance,
  type MenuCategory,
  type MenuHppBreakdown,
  type MenuItem,
  type Order,
  type ReportingPeriod,
  type ReportingSnapshot,
} from "@warungmeng/domain";

export const DASHBOARD_OUTLET_ID = "wm-1";
export const DASHBOARD_DATA_SOURCES = ["orders", "finance", "inventory", "catalog"] as const;

export type DashboardDataSource = (typeof DASHBOARD_DATA_SOURCES)[number];

export interface DashboardReportRepositories {
  readonly orders: Pick<OrderRepository, "listOrders">;
  readonly finance: Pick<FinanceRepository, "listManualTransactions">;
  readonly inventory: Pick<
    InventoryRepository,
    "listIngredients" | "listStockBalances" | "listMovements" | "listRecipes" | "calculateHpp"
  >;
  readonly catalog: Pick<MenuCatalogRepository, "listMenus" | "listCategories">;
}

export interface DashboardSourceError {
  readonly source: DashboardDataSource;
  readonly message: string;
  readonly failedItemIds?: readonly string[];
}

export type DashboardSourceErrors = Readonly<
  Partial<Record<DashboardDataSource, DashboardSourceError>>
>;

interface InventorySourceData {
  readonly ingredients: readonly InventoryIngredient[];
  readonly stockBalances: readonly InventoryStockBalance[];
  readonly inventoryMovements: readonly InventoryMovement[];
  readonly menuHpp: readonly MenuHppBreakdown[];
}

interface CatalogSourceData {
  readonly menuItems: readonly MenuItem[];
  readonly categories: readonly MenuCategory[];
}

export interface DashboardSourceCache {
  readonly orders?: readonly Order[];
  readonly finance?: readonly FinanceTransaction[];
  readonly inventory?: InventorySourceData;
  readonly catalog?: CatalogSourceData;
}

export type DashboardSourceResult =
  | {
      readonly source: "orders";
      readonly value: readonly Order[];
      readonly error?: DashboardSourceError;
    }
  | {
      readonly source: "finance";
      readonly value: readonly FinanceTransaction[];
      readonly error?: DashboardSourceError;
    }
  | {
      readonly source: "inventory";
      readonly value: InventorySourceData;
      readonly error?: DashboardSourceError;
    }
  | {
      readonly source: "catalog";
      readonly value: CatalogSourceData;
      readonly error?: DashboardSourceError;
    };

export function normalizeDashboardSourceError(
  source: DashboardDataSource,
  reason: unknown,
): DashboardSourceError {
  const message =
    reason instanceof Error && reason.message.trim().length > 0
      ? reason.message
      : typeof reason === "string" && reason.trim().length > 0
        ? reason
        : `Unable to load ${source} dashboard data`;
  return { source, message };
}

export function hasDashboardSource(
  cache: DashboardSourceCache,
  source: DashboardDataSource,
): boolean {
  return cache[source] !== undefined;
}

export function applyDashboardSourceResult(
  cache: DashboardSourceCache,
  result: DashboardSourceResult,
): DashboardSourceCache {
  switch (result.source) {
    case "orders":
      return { ...cache, orders: result.value };
    case "finance":
      return { ...cache, finance: result.value };
    case "inventory":
      return { ...cache, inventory: result.value };
    case "catalog":
      return { ...cache, catalog: result.value };
  }
}

export function buildDashboardReportingSnapshot(
  period: ReportingPeriod,
  cache: DashboardSourceCache,
): ReportingSnapshot {
  const orders = cache.orders ?? [];
  return {
    period: { ...period },
    orders,
    financeTransactions: sortFinanceTransactionsNewestFirst(
      buildFinanceLedger(orders, cache.finance ?? []),
    ),
    menuItems: cache.catalog?.menuItems ?? [],
    categories: cache.catalog?.categories ?? [],
    menuHpp: cache.inventory?.menuHpp ?? [],
    ingredients: cache.inventory?.ingredients ?? [],
    stockBalances: cache.inventory?.stockBalances ?? [],
    inventoryMovements: cache.inventory?.inventoryMovements ?? [],
  };
}

export async function loadDashboardSource(
  source: DashboardDataSource,
  repositories: DashboardReportRepositories,
): Promise<DashboardSourceResult> {
  switch (source) {
    case "orders":
      return {
        source,
        value: await repositories.orders.listOrders({ outletId: DASHBOARD_OUTLET_ID }),
      };
    case "finance":
      return { source, value: await repositories.finance.listManualTransactions() };
    case "catalog": {
      const [menuItems, categories] = await Promise.all([
        repositories.catalog.listMenus(),
        repositories.catalog.listCategories(),
      ]);
      return { source, value: { menuItems, categories } };
    }
    case "inventory": {
      const [ingredients, stockBalances, inventoryMovements, recipes] = await Promise.all([
        repositories.inventory.listIngredients(),
        repositories.inventory.listStockBalances(DASHBOARD_OUTLET_ID),
        repositories.inventory.listMovements({ outletId: DASHBOARD_OUTLET_ID }),
        repositories.inventory.listRecipes(),
      ]);
      const hppResults = await Promise.allSettled(
        recipes.map(async (recipe) => ({
          menuItemId: recipe.menuItemId,
          breakdown: await repositories.inventory.calculateHpp(recipe.menuItemId),
        })),
      );
      const menuHpp: MenuHppBreakdown[] = [];
      const failedItemIds: string[] = [];
      hppResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          if (result.value.breakdown !== null) menuHpp.push(result.value.breakdown);
        } else {
          const recipe = recipes[index];
          if (recipe) failedItemIds.push(recipe.menuItemId);
        }
      });

      const error =
        failedItemIds.length > 0
          ? {
              source,
              message: `Unable to calculate HPP for ${failedItemIds.length} menu item(s)`,
              failedItemIds,
            }
          : undefined;
      return {
        source,
        value: { ingredients, stockBalances, inventoryMovements, menuHpp },
        ...(error ? { error } : {}),
      };
    }
  }
}
