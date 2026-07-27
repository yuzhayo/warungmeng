import type { WarungMengModuleManifest } from "@warungmeng/module-system";

export const DASHBOARD_MODULE_ID = "admin.dashboard" as const;
export const REPORTING_READ_CAPABILITY_ID = "reporting.read" as const;

export const dashboardManifest = {
  id: DASHBOARD_MODULE_ID,
  version: 1,
  surface: "admin",
  displayNameKey: "navigation.performance",
  provides: [{ id: REPORTING_READ_CAPABILITY_ID, version: 1 }],
} as const satisfies WarungMengModuleManifest;
