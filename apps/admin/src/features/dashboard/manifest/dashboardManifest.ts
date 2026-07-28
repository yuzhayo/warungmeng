import type { WarungMengModuleManifest } from "@warungmeng/module-system";

export const DASHBOARD_MODULE_ID = "admin.dashboard" as const;
export const REPORTING_READ_CAPABILITY_ID = "reporting.read" as const;

// Stable contribution IDs — never change once shipped
export const DASHBOARD_NAV_ID = "admin.dashboard.nav.performance" as const;
export const DASHBOARD_ROUTE_ROOT_ID = "admin.dashboard.route.root" as const;
export const DASHBOARD_ROUTE_OVERVIEW_ID = "admin.dashboard.route.overview" as const;
export const DASHBOARD_ROUTE_REPORTS_ID = "admin.dashboard.route.reports" as const;

// Stable component IDs — resolved by adminRouteComponentRegistry (app-local)
export const DASHBOARD_COMPONENT_ROOT = "admin.dashboard.screen.root" as const;
export const DASHBOARD_COMPONENT_OVERVIEW = "admin.dashboard.screen.overview" as const;
export const DASHBOARD_COMPONENT_REPORTS = "admin.dashboard.screen.reports" as const;

// Stable icon ID — resolved by adminIconRegistry (app-local)
export const DASHBOARD_ICON_ID = "bar-chart" as const;

export const dashboardManifest = {
  id: DASHBOARD_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "navigation.performance",
  provides: [{ id: REPORTING_READ_CAPABILITY_ID, version: 1 }],
  contributions: [
    {
      kind: "navigation",
      id: DASHBOARD_NAV_ID,
      order: 0,
      labelKey: "navigation.performance",
      routeId: DASHBOARD_ROUTE_ROOT_ID,
      iconId: DASHBOARD_ICON_ID,
    },
    {
      kind: "route",
      id: DASHBOARD_ROUTE_ROOT_ID,
      order: 0,
      path: "/",
      componentId: DASHBOARD_COMPONENT_ROOT,
    },
    {
      kind: "route",
      id: DASHBOARD_ROUTE_OVERVIEW_ID,
      order: 0,
      path: "/",
      componentId: DASHBOARD_COMPONENT_OVERVIEW,
      parentRouteId: DASHBOARD_ROUTE_ROOT_ID,
      index: true,
    },
    {
      kind: "route",
      id: DASHBOARD_ROUTE_REPORTS_ID,
      order: 1,
      path: "reports",
      componentId: DASHBOARD_COMPONENT_REPORTS,
      parentRouteId: DASHBOARD_ROUTE_ROOT_ID,
    },
  ],
} as const satisfies WarungMengModuleManifest;
