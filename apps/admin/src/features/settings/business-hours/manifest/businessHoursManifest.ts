import type { WarungMengModuleManifest } from "@warungmeng/module-system";
import { SETTINGS_MODULE_ID, SETTINGS_ROUTE_ROOT_ID } from "../../manifest/settingsManifest";

export const SETTINGS_BUSINESS_HOURS_MODULE_ID = "admin.settings.business-hours" as const;
export const SETTINGS_BUSINESS_HOURS_ROUTE_ID =
  "admin.settings.business-hours.route.business-hours" as const;

export const businessHoursManifest = {
  id: SETTINGS_BUSINESS_HOURS_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "settings.tabs.businessHours",
  dependsOn: [{ moduleId: SETTINGS_MODULE_ID }],
  contributions: [
    {
      kind: "route",
      id: SETTINGS_BUSINESS_HOURS_ROUTE_ID,
      order: 2,
      path: "business-hours",
      parentRouteId: SETTINGS_ROUTE_ROOT_ID,
      componentId: "admin.settings.business-hours.screen",
    },
  ],
} as const satisfies WarungMengModuleManifest;
