import {
  createWarungMengFinanceRepository,
  createWarungMengInventoryRepository,
  createWarungMengMockRepository,
  createWarungMengOrderRepository,
} from "@warungmeng/data";
import { describe, expect, it, vi } from "vitest";
import {
  loadDashboardSource,
  normalizeDashboardSourceError,
  type DashboardReportRepositories,
} from "./dashboardReportData.core";

function createRepositories(): DashboardReportRepositories {
  return {
    orders: createWarungMengOrderRepository(),
    finance: createWarungMengFinanceRepository(),
    inventory: createWarungMengInventoryRepository(),
    catalog: createWarungMengMockRepository(),
  };
}

describe("dashboard report data core", () => {
  it("keeps valid inventory data when one HPP calculation fails", async () => {
    const repositories = createRepositories();
    const recipes = await repositories.inventory.listRecipes();
    const failedRecipe = recipes[0];
    if (!failedRecipe) throw new Error("Expected at least one inventory recipe fixture");
    vi.spyOn(repositories.inventory, "calculateHpp").mockRejectedValueOnce(
      new Error("invalid recipe"),
    );

    const result = await loadDashboardSource("inventory", repositories);

    expect(result.source).toBe("inventory");
    if (result.source !== "inventory") throw new Error("Expected inventory result");
    expect(result.value.ingredients.length).toBeGreaterThan(0);
    expect(result.value.stockBalances.length).toBeGreaterThan(0);
    expect(result.value.inventoryMovements.length).toBeGreaterThan(0);
    expect(result.value.menuHpp).toHaveLength(recipes.length - 1);
    expect(result.error).toEqual({
      source: "inventory",
      message: "Unable to calculate HPP for 1 menu item(s)",
      failedItemIds: [failedRecipe.menuItemId],
    });
  });

  it("normalizes unknown rejection values without exposing an unknown object", () => {
    expect(normalizeDashboardSourceError("orders", new Error("orders offline"))).toEqual({
      source: "orders",
      message: "orders offline",
    });
    expect(normalizeDashboardSourceError("catalog", { status: 503 })).toEqual({
      source: "catalog",
      message: "Unable to load catalog dashboard data",
    });
  });
});
