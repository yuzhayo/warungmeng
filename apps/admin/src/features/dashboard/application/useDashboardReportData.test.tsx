import {
  createWarungMengFinanceRepository,
  createWarungMengInventoryRepository,
  createWarungMengMockRepository,
  createWarungMengOrderRepository,
} from "@warungmeng/data";
import type { Order, ReportingPeriod } from "@warungmeng/domain";
import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";
import { bindDashboardRepositories, dashboardRepositories } from "./dashboardRepositories";
import { useDashboardReportData, type DashboardReportRepositories } from "./useDashboardReportData";

const TODAY: ReportingPeriod = {
  startDate: "2026-07-20",
  endDate: "2026-07-20",
  timeZone: "Asia/Jakarta",
};

function createRepositories(): DashboardReportRepositories {
  return {
    orders: createWarungMengOrderRepository(),
    finance: createWarungMengFinanceRepository(),
    inventory: createWarungMengInventoryRepository(),
    catalog: createWarungMengMockRepository(),
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function StrictModeWrapper({ children }: PropsWithChildren) {
  return <StrictMode>{children}</StrictMode>;
}

describe("useDashboardReportData", () => {
  it("preserves the legacy Dashboard model output through the feature-owned binding", async () => {
    const repositories = createRepositories();
    const cleanup = bindDashboardRepositories(repositories);

    try {
      const { result: legacyResult } = renderHook(() =>
        useDashboardReportData(TODAY, repositories),
      );
      const { result: boundResult } = renderHook(() =>
        useDashboardReportData(TODAY, dashboardRepositories),
      );

      await waitFor(() => expect(legacyResult.current.status).toBe("ready"));
      await waitFor(() => expect(boundResult.current.status).toBe("ready"));
      expect(boundResult.current.snapshot).toEqual(legacyResult.current.snapshot);
    } finally {
      cleanup();
    }
  });

  it("fails explicitly after the compatibility binding is disposed", () => {
    const cleanup = bindDashboardRepositories(createRepositories());
    expect(dashboardRepositories.orders).toBeDefined();

    cleanup();
    cleanup();

    expect(() => dashboardRepositories.orders).toThrow(
      "Dashboard repositories are not bound to an active Admin runtime.",
    );
  });

  it("loads one reporting snapshot without duplicate source reads or HPP calculations", async () => {
    const repositories = createRepositories();
    const recipeCount = (await repositories.inventory.listRecipes()).length;
    const listOrders = vi.spyOn(repositories.orders, "listOrders");
    const listManual = vi.spyOn(repositories.finance, "listManualTransactions");
    const listIngredients = vi.spyOn(repositories.inventory, "listIngredients");
    const listBalances = vi.spyOn(repositories.inventory, "listStockBalances");
    const listMovements = vi.spyOn(repositories.inventory, "listMovements");
    const listRecipes = vi.spyOn(repositories.inventory, "listRecipes");
    const calculateHpp = vi.spyOn(repositories.inventory, "calculateHpp");
    const listMenus = vi.spyOn(repositories.catalog, "listMenus");
    const listCategories = vi.spyOn(repositories.catalog, "listCategories");

    const { result } = renderHook(() => useDashboardReportData(TODAY, repositories), {
      wrapper: StrictModeWrapper,
    });

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.failedSources).toEqual([]);
    expect(result.current.errors).toEqual({});
    expect(result.current.snapshot).not.toBeNull();
    expect(result.current.snapshot?.period).toEqual(TODAY);
    expect(
      result.current.snapshot?.financeTransactions.some((item) => item.source === "automatic"),
    ).toBe(true);
    expect(
      result.current.snapshot?.financeTransactions.some((item) => item.source === "manual"),
    ).toBe(true);
    expect(listOrders).toHaveBeenCalledOnce();
    expect(listOrders).toHaveBeenCalledWith({ outletId: "wm-1" });
    expect(listManual).toHaveBeenCalledOnce();
    expect(listIngredients).toHaveBeenCalledOnce();
    expect(listBalances).toHaveBeenCalledOnce();
    expect(listMovements).toHaveBeenCalledOnce();
    expect(listRecipes).toHaveBeenCalledOnce();
    expect(listMenus).toHaveBeenCalledOnce();
    expect(listCategories).toHaveBeenCalledOnce();
    expect(calculateHpp).toHaveBeenCalledTimes(recipeCount);
    expect(new Set(calculateHpp.mock.calls.map(([menuItemId]) => menuItemId)).size).toBe(
      recipeCount,
    );
  });

  it("keeps successful data explicit and retries every failed source only", async () => {
    const repositories = createRepositories();
    const listOrders = vi.spyOn(repositories.orders, "listOrders");
    const listIngredients = vi.spyOn(repositories.inventory, "listIngredients");
    const listManual = vi
      .spyOn(repositories.finance, "listManualTransactions")
      .mockRejectedValueOnce(new Error("finance unavailable"));
    const listMenus = vi.spyOn(repositories.catalog, "listMenus");
    const listCategories = vi
      .spyOn(repositories.catalog, "listCategories")
      .mockRejectedValueOnce(new Error("catalog unavailable"));

    const { result } = renderHook(() => useDashboardReportData(TODAY, repositories));
    await waitFor(() => expect(result.current.status).toBe("partial"));

    expect(result.current.snapshot).not.toBeNull();
    expect(result.current.failedSources).toEqual(["finance", "catalog"]);
    expect(result.current.errors.finance?.message).toBe("finance unavailable");
    expect(result.current.errors.catalog?.message).toBe("catalog unavailable");

    act(() => result.current.retry());
    expect(result.current.retrying).toBe(true);
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(result.current.retrying).toBe(false);
    expect(result.current.failedSources).toEqual([]);
    expect(result.current.errors).toEqual({});
    expect(listManual).toHaveBeenCalledTimes(2);
    expect(listMenus).toHaveBeenCalledTimes(2);
    expect(listCategories).toHaveBeenCalledTimes(2);
    expect(listOrders).toHaveBeenCalledOnce();
    expect(listIngredients).toHaveBeenCalledOnce();
  });

  it("returns a normalized error when every source fails", async () => {
    const repositories = createRepositories();
    vi.spyOn(repositories.orders, "listOrders").mockRejectedValue(new Error("orders unavailable"));
    vi.spyOn(repositories.finance, "listManualTransactions").mockRejectedValue(
      new Error("finance unavailable"),
    );
    vi.spyOn(repositories.inventory, "listIngredients").mockRejectedValue(
      new Error("inventory unavailable"),
    );
    vi.spyOn(repositories.catalog, "listMenus").mockRejectedValue(new Error("catalog unavailable"));

    const { result } = renderHook(() => useDashboardReportData(TODAY, repositories));
    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.snapshot).toBeNull();
    expect(result.current.failedSources).toEqual(["orders", "finance", "inventory", "catalog"]);
    expect(Object.keys(result.current.errors)).toEqual([
      "orders",
      "finance",
      "inventory",
      "catalog",
    ]);
  });

  it("keeps the state partial when a failed source still fails after retry", async () => {
    const repositories = createRepositories();
    const listManual = vi
      .spyOn(repositories.finance, "listManualTransactions")
      .mockRejectedValue(new Error("finance remains unavailable"));

    const { result } = renderHook(() => useDashboardReportData(TODAY, repositories));
    await waitFor(() => expect(result.current.status).toBe("partial"));

    act(() => result.current.retry());
    await waitFor(() => expect(listManual).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.retrying).toBe(false));

    expect(result.current.status).toBe("partial");
    expect(result.current.failedSources).toEqual(["finance"]);
    expect(result.current.errors.finance?.message).toBe("finance remains unavailable");
  });

  it("preserves inventory data and reports a partial state when one HPP calculation fails", async () => {
    const repositories = createRepositories();
    const recipes = await repositories.inventory.listRecipes();
    const failedRecipe = recipes[0];
    if (!failedRecipe) throw new Error("Expected at least one inventory recipe fixture");
    const calculateHpp = vi
      .spyOn(repositories.inventory, "calculateHpp")
      .mockRejectedValueOnce(new Error("invalid recipe"));

    const { result } = renderHook(() => useDashboardReportData(TODAY, repositories));
    await waitFor(() => expect(result.current.status).toBe("partial"));

    expect(result.current.failedSources).toEqual(["inventory"]);
    expect(result.current.snapshot?.ingredients.length).toBeGreaterThan(0);
    expect(result.current.snapshot?.stockBalances.length).toBeGreaterThan(0);
    expect(result.current.snapshot?.menuHpp).toHaveLength(recipes.length - 1);
    expect(result.current.errors.inventory?.failedItemIds).toEqual([failedRecipe.menuItemId]);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.snapshot?.menuHpp).toHaveLength(recipes.length);
    expect(result.current.failedSources).toEqual([]);
    expect(result.current.errors).toEqual({});
    expect(calculateHpp).toHaveBeenCalledTimes(recipes.length * 2);
  });

  it("prevents a stale period response from overwriting a newer period", async () => {
    const repositories = createRepositories();
    const firstOrders = createDeferred<readonly Order[]>();
    const currentOrders = await createWarungMengOrderRepository().listOrders();
    const listOrders = vi
      .spyOn(repositories.orders, "listOrders")
      .mockImplementationOnce(() => firstOrders.promise)
      .mockResolvedValue(currentOrders);
    const nextPeriod: ReportingPeriod = {
      startDate: "2026-07-14",
      endDate: "2026-07-20",
      timeZone: "Asia/Jakarta",
    };

    const { result, rerender } = renderHook(
      ({ period }: { period: ReportingPeriod }) => useDashboardReportData(period, repositories),
      { initialProps: { period: TODAY } },
    );
    await waitFor(() => expect(listOrders).toHaveBeenCalledTimes(1));

    rerender({ period: nextPeriod });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.period).toEqual(nextPeriod);
    expect(result.current.snapshot?.orders).toEqual(currentOrders);

    await act(async () => {
      firstOrders.resolve([]);
      await firstOrders.promise;
    });

    expect(result.current.status).toBe("ready");
    expect(result.current.period).toEqual(nextPeriod);
    expect(result.current.snapshot?.period).toEqual(nextPeriod);
    expect(result.current.snapshot?.orders).toEqual(currentOrders);
  });

  it("clears failures while a newer period is loading", async () => {
    const repositories = createRepositories();
    const nextFinance = createDeferred<readonly never[]>();
    vi.spyOn(repositories.finance, "listManualTransactions")
      .mockRejectedValueOnce(new Error("finance unavailable"))
      .mockImplementationOnce(() => nextFinance.promise);
    const nextPeriod: ReportingPeriod = {
      startDate: "2026-07-14",
      endDate: "2026-07-20",
      timeZone: "Asia/Jakarta",
    };

    const { result, rerender } = renderHook(
      ({ period }: { period: ReportingPeriod }) => useDashboardReportData(period, repositories),
      { initialProps: { period: TODAY } },
    );
    await waitFor(() => expect(result.current.status).toBe("partial"));
    expect(result.current.failedSources).toEqual(["finance"]);

    rerender({ period: nextPeriod });
    expect(result.current.status).toBe("loading");
    expect(result.current.failedSources).toEqual([]);
    expect(result.current.errors).toEqual({});

    await act(async () => {
      nextFinance.resolve([]);
      await nextFinance.promise;
    });
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });
});
