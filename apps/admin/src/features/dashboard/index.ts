export {
  bindDashboardRepositories,
  bindUnavailableDashboardRepositories,
} from "./application/dashboardRepositories";
export type { DashboardRepositoriesPort } from "./application/ports/dashboardRepositoriesPort";
export { createDashboardExtension, reportingReadCapability } from "./manifest/dashboardExtension";
export {
  DASHBOARD_MODULE_ID,
  REPORTING_READ_CAPABILITY_ID,
  dashboardManifest,
} from "./manifest/dashboardManifest";
