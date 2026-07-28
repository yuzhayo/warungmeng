import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, afterEach } from "vitest";
import App from "../App";
import type { AdminRuntime } from "../app/composition/adminRuntime";
import { createAdminRuntime } from "../app/composition/createAdminRuntime";
import { createAdminRepositories } from "../app/composition/createAdminRepositories";
import { dashboardManifest } from "../features/dashboard";
import { resolveAdminManifestSet } from "../app/discovery/adminBuiltInManifests";
import { resolveAdminNavigation } from "../app/navigation/resolveAdminNavigation";
import { resolveAdminRoutes } from "../app/routing/resolveAdminRoutes";
import { idTranslations, enTranslations } from "@warungmeng/i18n";
import type { TranslationKey } from "@warungmeng/i18n";
import type { WarungMengModuleManifest } from "@warungmeng/module-system";
import {
  DASHBOARD_ROUTE_ROOT_ID,
  DASHBOARD_ROUTE_OVERVIEW_ID,
  DASHBOARD_ROUTE_REPORTS_ID,
} from "../features/dashboard/manifest/dashboardManifest";

function fakeTranslate(locale: "id" | "en") {
  return (key: TranslationKey): string => {
    const map = locale === "id" ? idTranslations : enTranslations;
    return (map as Record<string, string>)[key as string] ?? "";
  };
}

// ---------------------------------------------------------------------------
// Resolver unit tests — Dashboard route contribution wiring
// ---------------------------------------------------------------------------

describe("resolveAdminRoutes — Dashboard route contribution wiring", () => {
  it("resolveAdminRoutes with dashboardManifest produces 3 routes with no diagnostics", () => {
    const result = resolveAdminRoutes([dashboardManifest]);
    expect(result.routes).toHaveLength(3);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("all 3 Dashboard route IDs are present in resolved routes", () => {
    const result = resolveAdminRoutes([dashboardManifest]);
    const ids = result.routes.map((r) => r.id);
    expect(ids).toContain(DASHBOARD_ROUTE_ROOT_ID);
    expect(ids).toContain(DASHBOARD_ROUTE_OVERVIEW_ID);
    expect(ids).toContain(DASHBOARD_ROUTE_REPORTS_ID);
  });

  it("index route has no path property", () => {
    const result = resolveAdminRoutes([dashboardManifest]);
    const overview = result.routes.find((r) => r.id === DASHBOARD_ROUTE_OVERVIEW_ID);
    expect(overview?.index).toBe(true);
    expect(overview?.path).toBeUndefined();
  });

  it("removing Dashboard contribution produces 0 routes (fallback trigger)", () => {
    const emptyManifest: WarungMengModuleManifest = {
      ...dashboardManifest,
      contributions: [],
    };
    const result = resolveAdminRoutes([emptyManifest]);
    expect(result.routes).toHaveLength(0);
  });

  it("root route with unknown component → all 3 routes rejected, diagnostics emitted", () => {
    const brokenManifest: WarungMengModuleManifest = {
      ...dashboardManifest,
      contributions: dashboardManifest.contributions?.map((c) =>
        c.id === DASHBOARD_ROUTE_ROOT_ID && c.kind === "route"
          ? { ...c, componentId: "admin.dashboard.screen.nonexistent" }
          : c,
      ) as unknown as (typeof dashboardManifest)["contributions"],
    };
    const result = resolveAdminRoutes([brokenManifest]);
    expect(result.routes.some((r) => r.id === DASHBOARD_ROUTE_ROOT_ID)).toBe(false);
    expect(result.routes.some((r) => r.id === DASHBOARD_ROUTE_OVERVIEW_ID)).toBe(false);
    expect(result.routes.some((r) => r.id === DASHBOARD_ROUTE_REPORTS_ID)).toBe(false);
    expect(result.diagnostics.length).toBeGreaterThan(0);
  });

  it("six unmigrated module paths are not in resolved route IDs", () => {
    const result = resolveAdminRoutes([dashboardManifest]);
    const siblingPaths = ["/menu", "/finance", "/inventory", "/pos", "/orders", "/settings"];
    for (const path of siblingPaths) {
      expect(result.routes.some((r) => r.id.includes(path))).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Resolver unit tests — resolveAdminNavigation live wiring
// ---------------------------------------------------------------------------

describe("resolveAdminNavigation — live wiring with registry-derived resolvedRouteIds", () => {
  function resolvedRouteIdsFromManifests(manifests: readonly WarungMengModuleManifest[]) {
    const { routes } = resolveAdminRoutes(manifests);
    return new Set(routes.map((r) => r.id));
  }

  it("Dashboard nav item resolves when routeId is in resolvedRouteIds", () => {
    const resolvedRouteIds = resolvedRouteIdsFromManifests([dashboardManifest]);
    const result = resolveAdminNavigation(
      [dashboardManifest],
      fakeTranslate("id"),
      resolvedRouteIds,
    );
    expect(result.diagnostics).toHaveLength(0);
    const dashItem = result.items.find((i) => i.key === "/");
    expect(dashItem).toBeDefined();
    expect(dashItem?.labelKey).toBe("navigation.performance");
  });

  it("Dashboard nav item is rejected when its route is unresolved", () => {
    const result = resolveAdminNavigation(
      [dashboardManifest],
      fakeTranslate("id"),
      new Set<string>(),
    );
    expect(result.diagnostics.length).toBeGreaterThan(0);
    expect(result.items).toEqual([]);
  });

  it("ID label from resolver is non-empty", () => {
    const resolvedRouteIds = resolvedRouteIdsFromManifests([dashboardManifest]);
    const result = resolveAdminNavigation(
      [dashboardManifest],
      fakeTranslate("id"),
      resolvedRouteIds,
    );
    const dashItem = result.items.find((i) => i.key === "/");
    expect(fakeTranslate("id")(dashItem!.labelKey).length).toBeGreaterThan(0);
  });

  it("EN label from resolver is non-empty", () => {
    const resolvedRouteIds = resolvedRouteIdsFromManifests([dashboardManifest]);
    const result = resolveAdminNavigation(
      [dashboardManifest],
      fakeTranslate("en"),
      resolvedRouteIds,
    );
    const dashItem = result.items.find((i) => i.key === "/");
    expect(fakeTranslate("en")(dashItem!.labelKey).length).toBeGreaterThan(0);
  });

  it("manifest-set fallback keeps the six sibling modules available", () => {
    const { manifests } = resolveAdminManifestSet([dashboardManifest]);
    const routes = resolveAdminRoutes(manifests);
    const result = resolveAdminNavigation(
      manifests,
      fakeTranslate("id"),
      routes.resolvedRouteIds,
      routes.routePaths,
    );
    expect(result.items.map(({ key }) => key)).toEqual([
      "/",
      "/menu",
      "/finance",
      "/inventory",
      "/pos",
      "/orders",
      "/settings",
    ]);
  });

  it("removing Dashboard contribution leaves the module unresolved", () => {
    const emptyManifest: WarungMengModuleManifest = { ...dashboardManifest, contributions: [] };
    const resolvedRouteIds = resolvedRouteIdsFromManifests([emptyManifest]);
    const result = resolveAdminNavigation([emptyManifest], fakeTranslate("id"), resolvedRouteIds);
    expect(result.items).toEqual([]);
    expect(result.modules).toEqual([
      {
        moduleId: "admin.dashboard",
        status: "absent",
        contributionIds: [],
      },
    ]);
  });

  it("wrong surface manifest triggers a diagnostic and contributes no item", () => {
    const wrongSurface = { ...dashboardManifest, surface: "storefront" as const };
    const result = resolveAdminNavigation(
      [wrongSurface as unknown as WarungMengModuleManifest],
      fakeTranslate("id"),
      new Set<string>(),
    );
    expect(result.diagnostics.some((d) => d.includes("storefront"))).toBe(true);
    expect(result.items).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAdminNavigationSelectedKey — active state
// ---------------------------------------------------------------------------

import { getAdminNavigationSelectedKey } from "../app/navigation/resolveAdminNavigation";

describe("getAdminNavigationSelectedKey", () => {
  it.each([
    ["/", "/"],
    ["/reports", "/"],
    ["/reports/detail", "/"],
    ["/menu", "/menu"],
    ["/menu/new", "/menu"],
    ["/finance/expenses", "/finance"],
    ["/inventory", "/inventory"],
    ["/pos", "/pos"],
    ["/orders", "/orders"],
    ["/settings/theme", "/settings"],
    ["/unknown", "/"],
  ])("pathname %s → selected key %s", (pathname, expected) => {
    expect(getAdminNavigationSelectedKey(pathname)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// F5 — Render-based App tests: registry-driven route tree
// ---------------------------------------------------------------------------

const activeRuntimes = new Set<AdminRuntime>();

function renderWithRuntime(runtime: AdminRuntime) {
  activeRuntimes.add(runtime);
  return render(<App runtime={runtime} />);
}

afterEach(async () => {
  await Promise.all([...activeRuntimes].map((r) => r.dispose()));
  activeRuntimes.clear();
});

describe("AppRoutes — registry-driven render (F5)", () => {
  it("Dashboard route renders from manifest when registry has admin.dashboard", async () => {
    window.localStorage.clear();
    window.location.hash = "#/";
    const runtime = createAdminRuntime({ repositories: createAdminRepositories() });
    renderWithRuntime(runtime);

    await waitFor(() => expect(runtime.getSnapshot().status).toBe("ready"));
    expect(runtime.registry.list().map((m) => m.id)).toContain("admin.dashboard");
    expect(await screen.findByRole("heading", { name: "Dashboard & Laporan" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
  });

  it("/reports child route renders the manifest-resolved reports component", async () => {
    window.localStorage.clear();
    window.location.hash = "#/reports";
    const runtime = createAdminRuntime({ repositories: createAdminRepositories() });
    renderWithRuntime(runtime);

    await waitFor(() => expect(runtime.getSnapshot().status).toBe("ready"));
    // The "Penjualan" tab is rendered only by DashboardReportsScreen,
    // proving the manifest-resolved /reports component mounted — not just the shell.
    expect(await screen.findByRole("tab", { name: "Penjualan" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
  });

  it("degraded runtime (empty registry) uses the built-in Dashboard manifest", async () => {
    window.localStorage.clear();
    window.location.hash = "#/";
    const runtime = createAdminRuntime({
      repositories: createAdminRepositories(),
      candidates: [{ source: "dashboard", load: () => ({ manifest: null }) }],
    });
    renderWithRuntime(runtime);

    await waitFor(() => expect(runtime.getSnapshot().status).toBe("degraded"));
    expect(runtime.registry.list()).toHaveLength(0);
    // The built-in Dashboard route remains available, but its repositories
    // are intentionally unavailable and the existing error state is shown.
    expect(await screen.findByText("Dashboard gagal dimuat")).toBeInTheDocument();
  });

  it("nav items come from registry — Dashboard nav item present after ready", async () => {
    window.localStorage.clear();
    window.location.hash = "#/";
    const runtime = createAdminRuntime({ repositories: createAdminRepositories() });
    renderWithRuntime(runtime);

    await waitFor(() => expect(runtime.getSnapshot().status).toBe("ready"));
    const nav = screen.getByRole("navigation", { name: "Navigasi utama" });
    expect(nav).toBeInTheDocument();
    // All 7 nav items present
    expect(nav.querySelectorAll("li").length).toBeGreaterThanOrEqual(7);
  });
});
