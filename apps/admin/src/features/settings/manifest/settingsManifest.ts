import type { WarungMengModuleManifest } from "@warungmeng/module-system";

export const SETTINGS_MODULE_ID = "admin.settings" as const;
export const SETTINGS_NAV_ID = "admin.settings.nav.settings" as const;
export const SETTINGS_ROUTE_ROOT_ID = "admin.settings.route.root" as const;
export const SETTINGS_ROUTE_INDEX_ID = "admin.settings.route.index" as const;

export const settingsManifest = {
  id: SETTINGS_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "navigation.settings",
  contributions: [
    {
      kind: "navigation",
      id: SETTINGS_NAV_ID,
      order: 6,
      labelKey: "navigation.settings",
      routeId: SETTINGS_ROUTE_ROOT_ID,
      iconId: "settings",
    },
    {
      kind: "route",
      id: SETTINGS_ROUTE_ROOT_ID,
      order: 6,
      path: "settings",
      componentId: "admin.settings.screen.root",
    },
    {
      kind: "route",
      id: SETTINGS_ROUTE_INDEX_ID,
      order: 0,
      path: "",
      parentRouteId: SETTINGS_ROUTE_ROOT_ID,
      index: true,
      componentId: "admin.settings.redirect.theme",
    },
  ],
} as const satisfies WarungMengModuleManifest;
