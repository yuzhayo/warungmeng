import type { WarungMengModuleManifest } from "@warungmeng/module-system";

export const INVENTORY_MODULE_ID = "admin.inventory" as const;
export const INVENTORY_NAV_ID = "admin.inventory.nav.inventory" as const;
export const INVENTORY_ROUTE_ROOT_ID = "admin.inventory.route.root" as const;
export const INVENTORY_ROUTE_MATERIALS_ID = "admin.inventory.route.materials" as const;
export const INVENTORY_ROUTE_MOVEMENTS_ID = "admin.inventory.route.movements" as const;
export const INVENTORY_ROUTE_HPP_ID = "admin.inventory.route.hpp" as const;
export const INVENTORY_REDIRECT_CALCULATOR_ID = "admin.inventory.redirect.calculator" as const;

export const inventoryManifest = {
  id: INVENTORY_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "navigation.inventory",
  contributions: [
    {
      kind: "navigation",
      id: INVENTORY_NAV_ID,
      order: 3,
      labelKey: "navigation.inventory",
      routeId: INVENTORY_ROUTE_ROOT_ID,
      iconId: "database",
    },
    {
      kind: "route",
      id: INVENTORY_ROUTE_ROOT_ID,
      order: 3,
      path: "inventory",
      componentId: "admin.inventory.screen.root",
    },
    {
      kind: "route",
      id: INVENTORY_ROUTE_MATERIALS_ID,
      order: 0,
      path: "",
      parentRouteId: INVENTORY_ROUTE_ROOT_ID,
      index: true,
      componentId: "admin.inventory.screen.materials",
    },
    {
      kind: "route",
      id: INVENTORY_ROUTE_MOVEMENTS_ID,
      order: 1,
      path: "movements",
      parentRouteId: INVENTORY_ROUTE_ROOT_ID,
      componentId: "admin.inventory.screen.movements",
    },
    {
      kind: "route",
      id: INVENTORY_ROUTE_HPP_ID,
      order: 2,
      path: "hpp",
      parentRouteId: INVENTORY_ROUTE_ROOT_ID,
      componentId: "admin.inventory.screen.hpp",
    },
    {
      kind: "redirect",
      id: INVENTORY_REDIRECT_CALCULATOR_ID,
      order: 10,
      path: "calculator",
      to: "/inventory",
      replace: true,
    },
  ],
} as const satisfies WarungMengModuleManifest;
