import { describe, expect, it } from "vitest";
import type { WarungMengModuleManifest } from "@warungmeng/module-system";
import {
  dashboardManifest,
  DASHBOARD_COMPONENT_OVERVIEW,
  DASHBOARD_COMPONENT_REPORTS,
  DASHBOARD_COMPONENT_ROOT,
  DASHBOARD_ROUTE_OVERVIEW_ID,
  DASHBOARD_ROUTE_REPORTS_ID,
  DASHBOARD_ROUTE_ROOT_ID,
} from "../features/dashboard/manifest/dashboardManifest";
import { resolveAdminRoutes } from "../app/routing/resolveAdminRoutes";
import { financeManifest } from "../features/finance";
import { inventoryManifest } from "../features/inventory";
import { menuManifest } from "../features/menu";
import { ordersManifest } from "../features/orders";
import { posManifest } from "../features/pos";
import { businessHoursManifest, settingsManifest, themeManifest } from "../features/settings";

describe("Dashboard route contributions — manifest shape", () => {
  const routes = dashboardManifest.contributions?.filter((c) => c.kind === "route") ?? [];

  it("has exactly 3 route contributions", () => {
    expect(routes).toHaveLength(3);
  });

  it("root route has stable ID and correct path", () => {
    const root = routes.find((c) => c.id === DASHBOARD_ROUTE_ROOT_ID);
    expect(root).toBeDefined();
    expect(root?.kind === "route" && root.path).toBe("/");
  });

  it("overview route is index child of root", () => {
    const overview = routes.find((c) => c.id === DASHBOARD_ROUTE_OVERVIEW_ID);
    expect(overview).toBeDefined();
    expect(overview?.kind === "route" && overview.index).toBe(true);
    expect(overview?.kind === "route" && overview.parentRouteId).toBe(DASHBOARD_ROUTE_ROOT_ID);
    expect(overview?.kind === "route" && overview.componentId).toBe(DASHBOARD_COMPONENT_OVERVIEW);
  });

  it("reports route is non-index child of root with path 'reports'", () => {
    const reports = routes.find((c) => c.id === DASHBOARD_ROUTE_REPORTS_ID);
    expect(reports).toBeDefined();
    expect(reports?.kind === "route" && reports.path).toBe("reports");
    expect(reports?.kind === "route" && reports.parentRouteId).toBe(DASHBOARD_ROUTE_ROOT_ID);
    expect(reports?.kind === "route" && reports.componentId).toBe(DASHBOARD_COMPONENT_REPORTS);
  });

  it("root route uses correct component ID", () => {
    const root = routes.find((c) => c.id === DASHBOARD_ROUTE_ROOT_ID);
    expect(root?.kind === "route" && root.componentId).toBe(DASHBOARD_COMPONENT_ROOT);
  });

  it("all route IDs are unique", () => {
    const ids = routes.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("route orders are deterministic", () => {
    const root = routes.find((c) => c.id === DASHBOARD_ROUTE_ROOT_ID);
    const overview = routes.find((c) => c.id === DASHBOARD_ROUTE_OVERVIEW_ID);
    const reports = routes.find((c) => c.id === DASHBOARD_ROUTE_REPORTS_ID);
    expect(root?.order).toBe(0);
    expect(overview?.order).toBe(0);
    expect(reports?.order).toBe(1);
  });
});

describe("resolveAdminRoutes — Dashboard pilot", () => {
  it("resolves all 3 Dashboard routes with no diagnostics", () => {
    const result = resolveAdminRoutes([dashboardManifest]);
    expect(result.routes).toHaveLength(3);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("resolved root route has correct path and component", () => {
    const result = resolveAdminRoutes([dashboardManifest]);
    const root = result.routes.find((r) => r.id === DASHBOARD_ROUTE_ROOT_ID);
    expect(root?.path).toBe("/");
    expect(root?.componentId).toBe(DASHBOARD_COMPONENT_ROOT);
    expect(root?.parentRouteId).toBeUndefined();
  });

  it("resolved overview route is index child of root", () => {
    const result = resolveAdminRoutes([dashboardManifest]);
    const overview = result.routes.find((r) => r.id === DASHBOARD_ROUTE_OVERVIEW_ID);
    expect(overview?.index).toBe(true);
    expect(overview?.parentRouteId).toBe(DASHBOARD_ROUTE_ROOT_ID);
  });

  it("resolved reports route is non-index child with path 'reports'", () => {
    const result = resolveAdminRoutes([dashboardManifest]);
    const reports = result.routes.find((r) => r.id === DASHBOARD_ROUTE_REPORTS_ID);
    expect(reports?.path).toBe("reports");
    expect(reports?.parentRouteId).toBe(DASHBOARD_ROUTE_ROOT_ID);
    expect(reports?.index).toBeUndefined();
  });

  it("rejects duplicate contribution ID and emits diagnostic", () => {
    const dupeManifest = {
      ...dashboardManifest,
      contributions: [
        ...(dashboardManifest.contributions ?? []),
        // duplicate root route
        {
          kind: "route" as const,
          id: DASHBOARD_ROUTE_ROOT_ID,
          order: 99,
          path: "/duplicate",
          componentId: DASHBOARD_COMPONENT_ROOT,
        },
      ],
    } as unknown as WarungMengModuleManifest;
    const result = resolveAdminRoutes([dupeManifest]);
    const rootRoutes = result.routes.filter((r) => r.id === DASHBOARD_ROUTE_ROOT_ID);
    expect(rootRoutes).toHaveLength(0);
    expect(result.modules.find(({ moduleId }) => moduleId === "admin.dashboard")?.status).toBe(
      "fallback",
    );
    expect(result.diagnostics.some((d) => d.includes(DASHBOARD_ROUTE_ROOT_ID))).toBe(true);
  });

  it("rejects every route from a module with a duplicate sibling path", () => {
    const duplicatePathManifest = {
      ...dashboardManifest,
      contributions: [
        ...(dashboardManifest.contributions ?? []),
        {
          kind: "route" as const,
          id: "admin.dashboard.route.reports-copy",
          order: 2,
          path: "reports",
          componentId: DASHBOARD_COMPONENT_REPORTS,
          parentRouteId: DASHBOARD_ROUTE_ROOT_ID,
        },
      ],
    } as unknown as WarungMengModuleManifest;

    const result = resolveAdminRoutes([duplicatePathManifest]);

    expect(result.routes).toEqual([]);
    expect(result.resolvedRouteIds).toEqual(new Set());
    expect(result.modules).toEqual([
      {
        moduleId: "admin.dashboard",
        status: "fallback",
        routeIds: [],
      },
    ]);
    expect(
      result.diagnostics.some((diagnostic) => diagnostic.includes("Duplicate route path")),
    ).toBe(true);
  });

  it("rejects route with unknown parent and emits diagnostic", () => {
    const orphanManifest = {
      ...dashboardManifest,
      contributions: [
        ...(dashboardManifest.contributions ?? []),
        {
          kind: "route" as const,
          id: "admin.dashboard.route.orphan",
          order: 5,
          path: "orphan",
          componentId: DASHBOARD_COMPONENT_OVERVIEW,
          parentRouteId: "admin.dashboard.route.nonexistent",
        },
      ],
    } as unknown as WarungMengModuleManifest;
    const result = resolveAdminRoutes([orphanManifest]);
    expect(result.routes.find((r) => r.id === "admin.dashboard.route.orphan")).toBeUndefined();
    expect(result.diagnostics.some((d) => d.includes("orphan"))).toBe(true);
  });

  it("rejects route with unknown component ID and emits diagnostic", () => {
    const badComponentManifest = {
      ...dashboardManifest,
      contributions: dashboardManifest.contributions?.map((c) =>
        c.id === DASHBOARD_ROUTE_ROOT_ID && c.kind === "route"
          ? { ...c, componentId: "admin.dashboard.screen.nonexistent" }
          : c,
      ),
    } as unknown as WarungMengModuleManifest;
    const result = resolveAdminRoutes([badComponentManifest]);
    expect(result.routes.find((r) => r.id === DASHBOARD_ROUTE_ROOT_ID)).toBeUndefined();
    expect(result.diagnostics.some((d) => d.includes(DASHBOARD_ROUTE_ROOT_ID))).toBe(true);
  });

  it("ignores non-admin surface manifests", () => {
    const wrongSurface = { ...dashboardManifest, surface: "storefront" as const };
    const result = resolveAdminRoutes([wrongSurface as any]);
    expect(result.routes).toHaveLength(0);
  });

  it("empty manifests array returns empty routes with no diagnostics", () => {
    const result = resolveAdminRoutes([]);
    expect(result.routes).toHaveLength(0);
    expect(result.diagnostics).toHaveLength(0);
  });

  it("duplicate manifest registration deduplicates routes", () => {
    const result = resolveAdminRoutes([dashboardManifest, dashboardManifest]);
    const rootRoutes = result.routes.filter((r) => r.id === DASHBOARD_ROUTE_ROOT_ID);
    expect(rootRoutes).toHaveLength(1);
  });
});

describe("adminImportBoundary — manifest has no forbidden imports", () => {
  it("dashboardManifest contributions contain only serializable data (no functions)", () => {
    const contributions = dashboardManifest.contributions ?? [];
    for (const c of contributions) {
      for (const value of Object.values(c)) {
        expect(typeof value).not.toBe("function");
        expect(typeof value).not.toBe("object");
      }
    }
  });
});

describe("Phase 03 aggregate route registry", () => {
  const allManifests = [
    dashboardManifest,
    menuManifest,
    settingsManifest,
    themeManifest,
    businessHoursManifest,
    inventoryManifest,
    financeManifest,
    posManifest,
    ordersManifest,
  ];

  it("resolves every Admin module without diagnostics", () => {
    const result = resolveAdminRoutes(allManifests);

    expect(result.diagnostics).toEqual([]);
    expect(
      result.modules.filter(({ status }) => status === "resolved").map(({ moduleId }) => moduleId),
    ).toEqual([
      "admin.dashboard",
      "admin.finance",
      "admin.inventory",
      "admin.menu",
      "admin.orders",
      "admin.pos",
      "admin.settings",
      "admin.settings.business-hours",
      "admin.settings.theme",
    ]);
  });

  it("keeps current redirect and nested route paths declarative", () => {
    const result = resolveAdminRoutes(allManifests);
    const calculator = result.routes.find(
      (route) => route.id === "admin.inventory.redirect.calculator",
    );
    const theme = result.routes.find((route) => route.id === "admin.settings.theme.route.theme");
    const businessHours = result.routes.find(
      (route) => route.id === "admin.settings.business-hours.route.business-hours",
    );

    expect(calculator).toMatchObject({
      kind: "redirect",
      fullPath: "/calculator",
      to: "/inventory",
      replace: true,
    });
    expect(theme).toMatchObject({
      fullPath: "/settings/theme",
      parentRouteId: "admin.settings.route.root",
    });
    expect(businessHours).toMatchObject({
      fullPath: "/settings/business-hours",
      parentRouteId: "admin.settings.route.root",
    });
  });

  it("falls back only the module with an unknown component", () => {
    const brokenMenu = {
      ...menuManifest,
      contributions: menuManifest.contributions.map((contribution) =>
        contribution.id === "admin.menu.route.root" && contribution.kind === "route"
          ? { ...contribution, componentId: "admin.menu.screen.missing" }
          : contribution,
      ),
    } as unknown as WarungMengModuleManifest;
    const result = resolveAdminRoutes([dashboardManifest, brokenMenu, financeManifest]);

    expect(result.modules.find(({ moduleId }) => moduleId === "admin.dashboard")?.status).toBe(
      "resolved",
    );
    expect(result.modules.find(({ moduleId }) => moduleId === "admin.menu")?.status).toBe(
      "fallback",
    );
    expect(result.routes.some(({ moduleId }) => moduleId === "admin.dashboard")).toBe(true);
    expect(result.routes.some(({ moduleId }) => moduleId === "admin.menu")).toBe(false);
    expect(result.resolvedRouteIds.has("admin.menu.route.root")).toBe(false);
    expect(result.routePaths.has("admin.menu.route.root")).toBe(false);
  });

  it("rejects dependent child modules when a parent route module is invalid", () => {
    const brokenSettings = {
      ...settingsManifest,
      contributions: settingsManifest.contributions.map((contribution) =>
        contribution.id === "admin.settings.route.root" && contribution.kind === "route"
          ? { ...contribution, componentId: "admin.settings.screen.missing" }
          : contribution,
      ),
    } as unknown as WarungMengModuleManifest;
    const result = resolveAdminRoutes([brokenSettings, themeManifest, businessHoursManifest]);

    expect(result.routes).toEqual([]);
    expect(result.modules.find(({ moduleId }) => moduleId === "admin.settings")?.status).toBe(
      "fallback",
    );
    expect(result.modules.find(({ moduleId }) => moduleId === "admin.settings.theme")?.status).toBe(
      "fallback",
    );
    expect(
      result.modules.find(({ moduleId }) => moduleId === "admin.settings.business-hours")?.status,
    ).toBe("fallback");
  });

  it("detects parent cycles without recursive overflow", () => {
    const cyclicManifest: WarungMengModuleManifest = {
      id: "admin.cycle-test",
      version: 1,
      surface: "admin",
      displayNameKey: "navigation.menu",
      contributions: [
        {
          kind: "route",
          id: "admin.cycle-test.route.a",
          order: 0,
          path: "cycle-a",
          parentRouteId: "admin.cycle-test.route.b",
          componentId: "admin.menu.screen.root",
        },
        {
          kind: "route",
          id: "admin.cycle-test.route.b",
          order: 1,
          path: "cycle-b",
          parentRouteId: "admin.cycle-test.route.a",
          componentId: "admin.menu.screen.root",
        },
      ],
    };

    const result = resolveAdminRoutes([cyclicManifest]);

    expect(result.modules[0]?.status).toBe("fallback");
    expect(result.routes).toEqual([]);
    expect(result.diagnostics.some((diagnostic) => diagnostic.includes("cycle"))).toBe(true);
  });
});
