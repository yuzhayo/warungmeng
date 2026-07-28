import type { WarungMengModuleManifest } from "@warungmeng/module-system";

export const FINANCE_MODULE_ID = "admin.finance" as const;
export const FINANCE_READ_CAPABILITY_ID = "finance.read" as const;
export const FINANCE_RECORD_CAPABILITY_ID = "finance.record" as const;
export const FINANCE_REFUND_CAPABILITY_ID = "finance.refund" as const;
export const FINANCE_NAV_ID = "admin.finance.nav.finance" as const;
export const FINANCE_ROUTE_ROOT_ID = "admin.finance.route.root" as const;
export const FINANCE_ROUTE_OVERVIEW_ID = "admin.finance.route.overview" as const;
export const FINANCE_ROUTE_TRANSACTIONS_ID = "admin.finance.route.transactions" as const;
export const FINANCE_ROUTE_EXPENSES_ID = "admin.finance.route.expenses" as const;

export const financeManifest = {
  id: FINANCE_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "navigation.finance",
  provides: [
    { id: FINANCE_READ_CAPABILITY_ID, version: 1 },
    { id: FINANCE_RECORD_CAPABILITY_ID, version: 1 },
    { id: FINANCE_REFUND_CAPABILITY_ID, version: 1 },
  ],
  contributions: [
    {
      kind: "navigation",
      id: FINANCE_NAV_ID,
      order: 2,
      labelKey: "navigation.finance",
      routeId: FINANCE_ROUTE_ROOT_ID,
      iconId: "wallet",
    },
    {
      kind: "route",
      id: FINANCE_ROUTE_ROOT_ID,
      order: 2,
      path: "finance",
      componentId: "admin.finance.screen.root",
    },
    {
      kind: "route",
      id: FINANCE_ROUTE_OVERVIEW_ID,
      order: 0,
      path: "",
      parentRouteId: FINANCE_ROUTE_ROOT_ID,
      index: true,
      componentId: "admin.finance.redirect.overview",
    },
    {
      kind: "route",
      id: "admin.finance.route.overview-content",
      order: 1,
      path: "overview",
      parentRouteId: FINANCE_ROUTE_ROOT_ID,
      componentId: "admin.finance.screen.overview",
    },
    {
      kind: "route",
      id: FINANCE_ROUTE_TRANSACTIONS_ID,
      order: 2,
      path: "transactions",
      parentRouteId: FINANCE_ROUTE_ROOT_ID,
      componentId: "admin.finance.screen.transactions",
    },
    {
      kind: "route",
      id: FINANCE_ROUTE_EXPENSES_ID,
      order: 3,
      path: "expenses",
      parentRouteId: FINANCE_ROUTE_ROOT_ID,
      componentId: "admin.finance.screen.expenses",
    },
  ],
} as const satisfies WarungMengModuleManifest;
