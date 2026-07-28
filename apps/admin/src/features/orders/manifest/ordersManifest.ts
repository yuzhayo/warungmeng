import type { WarungMengModuleManifest } from "@warungmeng/module-system";

export const ORDERS_MODULE_ID = "admin.orders" as const;
export const ORDERS_READ_CAPABILITY_ID = "orders.read" as const;
export const ORDERS_MANAGE_CAPABILITY_ID = "orders.manage" as const;
export const ORDERS_NAV_ID = "admin.orders.nav.orders" as const;
export const ORDERS_ROUTE_ROOT_ID = "admin.orders.route.root" as const;
export const ORDERS_ROUTE_DETAIL_ID = "admin.orders.route.detail" as const;

export const ordersManifest = {
  id: ORDERS_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "navigation.orders",
  provides: [
    { id: ORDERS_READ_CAPABILITY_ID, version: 1 },
    { id: ORDERS_MANAGE_CAPABILITY_ID, version: 1 },
  ],
  contributions: [
    {
      kind: "navigation",
      id: ORDERS_NAV_ID,
      order: 5,
      labelKey: "navigation.orders",
      routeId: ORDERS_ROUTE_ROOT_ID,
      iconId: "shopping-cart",
    },
    {
      kind: "route",
      id: ORDERS_ROUTE_ROOT_ID,
      order: 5,
      path: "orders",
      componentId: "admin.orders.screen.list",
    },
    {
      kind: "route",
      id: ORDERS_ROUTE_DETAIL_ID,
      order: 6,
      path: "orders/:orderId",
      componentId: "admin.orders.screen.detail",
    },
  ],
} as const satisfies WarungMengModuleManifest;
