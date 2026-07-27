import { createCapabilityToken, type WarungMengExtension } from "@warungmeng/module-system";
import type { DashboardRepositoriesPort } from "../application/ports/dashboardRepositoriesPort";
import { dashboardManifest, REPORTING_READ_CAPABILITY_ID } from "./dashboardManifest";

export const reportingReadCapability = createCapabilityToken<DashboardRepositoriesPort>(
  REPORTING_READ_CAPABILITY_ID,
);

export function createDashboardExtension(
  repositories: DashboardRepositoriesPort,
): WarungMengExtension {
  return {
    manifest: dashboardManifest,
    register({ capabilities }) {
      capabilities.provide(reportingReadCapability, repositories);
    },
  };
}
