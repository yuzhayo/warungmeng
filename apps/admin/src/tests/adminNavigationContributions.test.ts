import { enTranslations, idTranslations, type TranslationKey } from "@warungmeng/i18n";
import type { WarungMengModuleManifest } from "@warungmeng/module-system";
import { describe, expect, it } from "vitest";
import {
  adminBuiltInManifests,
  resolveAdminManifestSet,
} from "../app/discovery/adminBuiltInManifests";
import {
  getAdminNavigationSelectedKey,
  resolveAdminNavigation,
} from "../app/navigation/resolveAdminNavigation";
import { resolveAdminRoutes } from "../app/routing/resolveAdminRoutes";
import { dashboardManifest } from "../features/dashboard";
import {
  DASHBOARD_ICON_ID,
  DASHBOARD_NAV_ID,
  DASHBOARD_ROUTE_ROOT_ID,
} from "../features/dashboard/manifest/dashboardManifest";
import { financeManifest } from "../features/finance";
import { inventoryManifest } from "../features/inventory";
import { menuManifest } from "../features/menu";
import { ordersManifest } from "../features/orders";
import { posManifest } from "../features/pos";
import { businessHoursManifest, settingsManifest, themeManifest } from "../features/settings";

const expectedNavigation = [
  {
    moduleId: "admin.dashboard",
    contributionId: DASHBOARD_NAV_ID,
    routeId: DASHBOARD_ROUTE_ROOT_ID,
    key: "/",
    labelKey: "navigation.performance",
    iconId: DASHBOARD_ICON_ID,
    order: 0,
  },
  {
    moduleId: "admin.menu",
    contributionId: "admin.menu.nav.menu",
    routeId: "admin.menu.route.root",
    key: "/menu",
    labelKey: "navigation.menu",
    iconId: "app-grid",
    order: 1,
  },
  {
    moduleId: "admin.finance",
    contributionId: "admin.finance.nav.finance",
    routeId: "admin.finance.route.root",
    key: "/finance",
    labelKey: "navigation.finance",
    iconId: "wallet",
    order: 2,
  },
  {
    moduleId: "admin.inventory",
    contributionId: "admin.inventory.nav.inventory",
    routeId: "admin.inventory.route.root",
    key: "/inventory",
    labelKey: "navigation.inventory",
    iconId: "database",
    order: 3,
  },
  {
    moduleId: "admin.pos",
    contributionId: "admin.pos.nav.pos",
    routeId: "admin.pos.route.root",
    key: "/pos",
    labelKey: "navigation.pos",
    iconId: "shop",
    order: 4,
  },
  {
    moduleId: "admin.orders",
    contributionId: "admin.orders.nav.orders",
    routeId: "admin.orders.route.root",
    key: "/orders",
    labelKey: "navigation.orders",
    iconId: "shopping-cart",
    order: 5,
  },
  {
    moduleId: "admin.settings",
    contributionId: "admin.settings.nav.settings",
    routeId: "admin.settings.route.root",
    key: "/settings",
    labelKey: "navigation.settings",
    iconId: "settings",
    order: 6,
  },
] as const;

function fakeTranslate(locale: "id" | "en") {
  return (key: TranslationKey): string => {
    const map = locale === "id" ? idTranslations : enTranslations;
    return map[key] ?? "";
  };
}

function resolveAll(locale: "id" | "en" = "id") {
  const routes = resolveAdminRoutes(adminBuiltInManifests);
  return resolveAdminNavigation(
    adminBuiltInManifests,
    fakeTranslate(locale),
    routes.resolvedRouteIds,
    routes.routePaths,
  );
}

describe("Phase 03 Admin navigation manifests", () => {
  it("uses stable IDs and deterministic order for every top-level module", () => {
    const actual = adminBuiltInManifests
      .flatMap((manifest) =>
        (manifest.contributions ?? [])
          .filter((contribution) => contribution.kind === "navigation")
          .map((contribution) => ({
            moduleId: manifest.id,
            contributionId: contribution.id,
            routeId: contribution.routeId,
            labelKey: contribution.labelKey,
            iconId: contribution.iconId,
            order: contribution.order,
          })),
      )
      .sort((left, right) => left.order - right.order);

    expect(actual).toEqual(
      expectedNavigation.map(({ key: _key, ...contribution }) => contribution),
    );
  });

  it("resolves the seven sidebar items from manifests in current UI order", () => {
    const result = resolveAll();

    expect(result.diagnostics).toEqual([]);
    expect(
      result.items.map(({ moduleId, key, labelKey, iconId, order }) => ({
        moduleId,
        key,
        labelKey,
        iconId,
        order,
      })),
    ).toEqual(
      expectedNavigation.map(({ contributionId: _contributionId, routeId: _routeId, ...item }) => ({
        ...item,
      })),
    );
  });

  it("keeps every navigation route reference resolvable", () => {
    const routes = resolveAdminRoutes(adminBuiltInManifests);

    for (const item of expectedNavigation) {
      expect(routes.resolvedRouteIds.has(item.routeId), item.routeId).toBe(true);
      expect(routes.routePaths.get(item.routeId), item.routeId).toBe(item.key);
    }
  });

  it("keeps ID and EN on the same contribution graph with non-empty labels", () => {
    const id = resolveAll("id");
    const en = resolveAll("en");

    expect(id.items.map(({ key, labelKey }) => [key, labelKey])).toEqual(
      en.items.map(({ key, labelKey }) => [key, labelKey]),
    );
    for (const item of id.items) {
      expect(fakeTranslate("id")(item.labelKey)).not.toBe("");
      expect(fakeTranslate("en")(item.labelKey)).not.toBe("");
    }
  });

  it("keeps Settings as one clickable item while its child routes use tabs", () => {
    const result = resolveAll();
    const settings = result.items.find(({ key }) => key === "/settings");

    expect(settings?.children).toBeUndefined();
    expect(getAdminNavigationSelectedKey("/settings/theme", result.items)).toBe("/settings");
    expect(getAdminNavigationSelectedKey("/settings/business-hours", result.items)).toBe(
      "/settings",
    );
  });

  it.each([
    ["/", "/"],
    ["/reports", "/"],
    ["/menu/new", "/menu"],
    ["/finance/expenses", "/finance"],
    ["/inventory/hpp", "/inventory"],
    ["/pos", "/pos"],
    ["/orders/order-1008", "/orders"],
    ["/settings/theme", "/settings"],
    ["/unknown", "/"],
  ])("maps %s to active sidebar key %s", (pathname, expectedKey) => {
    expect(getAdminNavigationSelectedKey(pathname, resolveAll().items)).toBe(expectedKey);
  });
});

describe("resolveAdminNavigation validation", () => {
  it("rejects only a module whose icon ID is unknown", () => {
    const brokenMenu = {
      ...menuManifest,
      contributions: menuManifest.contributions.map((contribution) =>
        contribution.kind === "navigation"
          ? { ...contribution, iconId: "missing-icon" }
          : contribution,
      ),
    } as unknown as WarungMengModuleManifest;
    const manifests = [
      dashboardManifest,
      brokenMenu,
      settingsManifest,
      themeManifest,
      businessHoursManifest,
      inventoryManifest,
      financeManifest,
      posManifest,
      ordersManifest,
    ];
    const routes = resolveAdminRoutes(manifests);
    const result = resolveAdminNavigation(
      manifests,
      fakeTranslate("id"),
      routes.resolvedRouteIds,
      routes.routePaths,
    );

    expect(result.diagnostics.some((diagnostic) => diagnostic.includes("missing-icon"))).toBe(true);
    expect(result.items.map(({ key }) => key)).toEqual([
      "/",
      "/finance",
      "/inventory",
      "/pos",
      "/orders",
      "/settings",
    ]);
    expect(result.modules.find(({ moduleId }) => moduleId === "admin.menu")?.status).toBe(
      "fallback",
    );
    expect(result.modules.find(({ moduleId }) => moduleId === "admin.finance")?.status).toBe(
      "resolved",
    );
  });

  it("rejects a module whose navigation references an unresolved route", () => {
    const brokenMenu = {
      ...menuManifest,
      contributions: menuManifest.contributions.map((contribution) =>
        contribution.kind === "navigation"
          ? { ...contribution, routeId: "admin.menu.route.missing" }
          : contribution,
      ),
    } as unknown as WarungMengModuleManifest;
    const result = resolveAdminNavigation([brokenMenu], fakeTranslate("id"));

    expect(result.items).toEqual([]);
    expect(result.diagnostics.some((diagnostic) => diagnostic.includes("route.missing"))).toBe(
      true,
    );
  });

  it("rejects duplicate navigation IDs without duplicating the first owner", () => {
    const duplicateManifest: WarungMengModuleManifest = {
      id: "admin.navigation-probe",
      version: 1,
      surface: "admin",
      displayNameKey: "navigation.menu",
      contributions: [
        {
          kind: "navigation",
          id: DASHBOARD_NAV_ID,
          order: 99,
          labelKey: "navigation.menu",
          routeId: DASHBOARD_ROUTE_ROOT_ID,
          iconId: "app-grid",
        },
      ],
    };
    const routes = resolveAdminRoutes([dashboardManifest, duplicateManifest]);
    const result = resolveAdminNavigation(
      [dashboardManifest, duplicateManifest],
      fakeTranslate("id"),
      routes.resolvedRouteIds,
      routes.routePaths,
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.moduleId).toBe("admin.dashboard");
    expect(result.diagnostics.some((diagnostic) => diagnostic.includes(DASHBOARD_NAV_ID))).toBe(
      true,
    );
  });

  it("rejects a missing navigation parent atomically", () => {
    const brokenMenu = {
      ...menuManifest,
      contributions: menuManifest.contributions.map((contribution) =>
        contribution.kind === "navigation"
          ? { ...contribution, parentId: "admin.menu.nav.missing-parent" }
          : contribution,
      ),
    } as unknown as WarungMengModuleManifest;
    const result = resolveAdminNavigation([brokenMenu], fakeTranslate("id"));

    expect(result.items).toEqual([]);
    expect(result.diagnostics.some((diagnostic) => diagnostic.includes("missing-parent"))).toBe(
      true,
    );
  });

  it("rejects navigation parent cycles without recursive overflow", () => {
    const cyclicManifest: WarungMengModuleManifest = {
      id: "admin.navigation-cycle",
      version: 1,
      surface: "admin",
      displayNameKey: "navigation.menu",
      contributions: [
        {
          kind: "navigation",
          id: "admin.navigation-cycle.nav.a",
          order: 0,
          labelKey: "navigation.menu",
          routeId: DASHBOARD_ROUTE_ROOT_ID,
          iconId: "app-grid",
          parentId: "admin.navigation-cycle.nav.b",
        },
        {
          kind: "navigation",
          id: "admin.navigation-cycle.nav.b",
          order: 1,
          labelKey: "navigation.menu",
          routeId: DASHBOARD_ROUTE_ROOT_ID,
          parentId: "admin.navigation-cycle.nav.a",
        },
      ],
    };
    const routes = resolveAdminRoutes([dashboardManifest, cyclicManifest]);
    const result = resolveAdminNavigation(
      [dashboardManifest, cyclicManifest],
      fakeTranslate("id"),
      routes.resolvedRouteIds,
      routes.routePaths,
    );

    expect(result.items.map(({ key }) => key)).toEqual(["/"]);
    expect(result.diagnostics.some((diagnostic) => diagnostic.includes("cycle"))).toBe(true);
  });

  it("reports wrong-surface manifests and emits no item for them", () => {
    const wrongSurface = {
      ...dashboardManifest,
      id: "storefront.dashboard",
      surface: "storefront",
    } as unknown as WarungMengModuleManifest;
    const result = resolveAdminNavigation([wrongSurface], fakeTranslate("id"));

    expect(result.items).toEqual([]);
    expect(result.diagnostics.some((diagnostic) => diagnostic.includes("storefront"))).toBe(true);
  });

  it("deduplicates repeated manifests deterministically", () => {
    const result = resolveAdminNavigation(
      [dashboardManifest, dashboardManifest],
      fakeTranslate("id"),
    );

    expect(result.items.map(({ key }) => key)).toEqual(["/"]);
    expect(result.diagnostics.some((diagnostic) => diagnostic.includes("Duplicate manifest"))).toBe(
      true,
    );
  });

  it("returns an empty result for an empty manifest set", () => {
    expect(resolveAdminNavigation([], fakeTranslate("id"))).toEqual({
      items: [],
      diagnostics: [],
      modules: [],
    });
  });
});

describe("built-in manifest fallback selection", () => {
  it("fills missing runtime modules from their feature-owned manifests", () => {
    const result = resolveAdminManifestSet([dashboardManifest]);

    expect(result.manifests).toHaveLength(9);
    expect(result.manifests[0]).toBe(dashboardManifest);
    expect([...result.fallbackModuleIds].sort()).toEqual([
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
});
