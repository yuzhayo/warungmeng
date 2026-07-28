import type { WarungMengModuleManifest } from "@warungmeng/module-system";

export const MENU_MODULE_ID = "admin.menu" as const;
export const CATALOG_READ_CAPABILITY_ID = "catalog.read" as const;
export const MENU_NAV_ID = "admin.menu.nav.menu" as const;
export const MENU_ROUTE_ROOT_ID = "admin.menu.route.root" as const;
export const MENU_ROUTE_LIST_ID = "admin.menu.route.list" as const;
export const MENU_ROUTE_CREATE_ID = "admin.menu.route.create" as const;
export const MENU_ROUTE_EDIT_ID = "admin.menu.route.edit" as const;
export const MENU_ROUTE_VARIANTS_ID = "admin.menu.route.variants" as const;
export const MENU_ROUTE_VARIANT_CREATE_ID = "admin.menu.route.variant-create" as const;
export const MENU_ROUTE_VARIANT_EDIT_ID = "admin.menu.route.variant-edit" as const;

export const menuManifest = {
  id: MENU_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "navigation.menu",
  provides: [{ id: CATALOG_READ_CAPABILITY_ID, version: 1 }],
  contributions: [
    {
      kind: "navigation",
      id: MENU_NAV_ID,
      order: 1,
      labelKey: "navigation.menu",
      routeId: MENU_ROUTE_ROOT_ID,
      iconId: "app-grid",
    },
    {
      kind: "route",
      id: MENU_ROUTE_ROOT_ID,
      order: 1,
      path: "menu",
      componentId: "admin.menu.screen.root",
    },
    {
      kind: "route",
      id: MENU_ROUTE_LIST_ID,
      order: 0,
      path: "",
      parentRouteId: MENU_ROUTE_ROOT_ID,
      index: true,
      componentId: "admin.menu.screen.list",
    },
    {
      kind: "route",
      id: MENU_ROUTE_CREATE_ID,
      order: 1,
      path: "new",
      parentRouteId: MENU_ROUTE_ROOT_ID,
      componentId: "admin.menu.screen.editor.create",
    },
    {
      kind: "route",
      id: MENU_ROUTE_EDIT_ID,
      order: 2,
      path: ":menuId/edit",
      parentRouteId: MENU_ROUTE_ROOT_ID,
      componentId: "admin.menu.screen.editor.edit",
    },
    {
      kind: "route",
      id: MENU_ROUTE_VARIANTS_ID,
      order: 3,
      path: "variants",
      parentRouteId: MENU_ROUTE_ROOT_ID,
      componentId: "admin.menu.screen.variants",
    },
    {
      kind: "route",
      id: MENU_ROUTE_VARIANT_CREATE_ID,
      order: 4,
      path: "variants/new",
      parentRouteId: MENU_ROUTE_ROOT_ID,
      componentId: "admin.menu.screen.variant-editor.create",
    },
    {
      kind: "route",
      id: MENU_ROUTE_VARIANT_EDIT_ID,
      order: 5,
      path: "variants/:variantGroupId/edit",
      parentRouteId: MENU_ROUTE_ROOT_ID,
      componentId: "admin.menu.screen.variant-editor.edit",
    },
  ],
} as const satisfies WarungMengModuleManifest;
