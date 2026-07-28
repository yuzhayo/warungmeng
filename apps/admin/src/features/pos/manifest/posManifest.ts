import type { WarungMengModuleManifest } from "@warungmeng/module-system";

export const POS_MODULE_ID = "admin.pos" as const;
export const POS_NAV_ID = "admin.pos.nav.pos" as const;
export const POS_ROUTE_ROOT_ID = "admin.pos.route.root" as const;

export const posManifest = {
  id: POS_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "navigation.pos",
  contributions: [
    {
      kind: "navigation",
      id: POS_NAV_ID,
      order: 4,
      labelKey: "navigation.pos",
      routeId: POS_ROUTE_ROOT_ID,
      iconId: "shop",
    },
    {
      kind: "route",
      id: POS_ROUTE_ROOT_ID,
      order: 4,
      path: "pos",
      componentId: "admin.pos.screen.cashier",
    },
  ],
} as const satisfies WarungMengModuleManifest;
