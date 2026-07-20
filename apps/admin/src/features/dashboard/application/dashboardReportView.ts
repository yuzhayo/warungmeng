export const DASHBOARD_REPORT_VALUES = ["sales", "menu", "inventory"] as const;

export type DashboardReportView = (typeof DASHBOARD_REPORT_VALUES)[number];

export const DEFAULT_DASHBOARD_REPORT: DashboardReportView = "sales";

export function isDashboardReportView(value: string | null): value is DashboardReportView {
  return DASHBOARD_REPORT_VALUES.includes(value as DashboardReportView);
}

/** Reads the active report while safely falling back for missing or unknown query values. */
export function parseDashboardReportSearchParams(
  searchParams: URLSearchParams,
): DashboardReportView {
  const value = searchParams.get("report");
  return isDashboardReportView(value) ? value : DEFAULT_DASHBOARD_REPORT;
}

/** Updates only the report query and preserves period/custom/unrelated search parameters. */
export function updateDashboardReportSearchParams(
  searchParams: URLSearchParams,
  report: DashboardReportView,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.set("report", report);
  return next;
}
