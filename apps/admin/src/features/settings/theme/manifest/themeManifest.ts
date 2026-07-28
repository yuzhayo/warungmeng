import type { WarungMengModuleManifest } from "@warungmeng/module-system";
import { SETTINGS_MODULE_ID, SETTINGS_ROUTE_ROOT_ID } from "../../manifest/settingsManifest";

export const SETTINGS_THEME_MODULE_ID = "admin.settings.theme" as const;
export const SETTINGS_THEME_ROUTE_ID = "admin.settings.theme.route.theme" as const;

export const themeManifest = {
  id: SETTINGS_THEME_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "settings.tabs.theme",
  dependsOn: [{ moduleId: SETTINGS_MODULE_ID }],
  contributions: [
    {
      kind: "route",
      id: SETTINGS_THEME_ROUTE_ID,
      order: 1,
      path: "theme",
      parentRouteId: SETTINGS_ROUTE_ROOT_ID,
      componentId: "admin.settings.theme.screen",
    },
  ],
} as const satisfies WarungMengModuleManifest;
