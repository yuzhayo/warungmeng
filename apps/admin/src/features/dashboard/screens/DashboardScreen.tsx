import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TabbedScreenLayout } from "../../../components/layout/TabbedScreenLayout";
import {
  createDashboardOverviewModel,
  type DashboardOverviewModel,
} from "../application/dashboardOverviewModel";
import { dashboardRepositories } from "../application/dashboardRepositories";
import { useDashboardPeriodSearch } from "../application/useDashboardPeriodSearch";
import {
  useDashboardReportData,
  type DashboardReportDataResult,
  type DashboardReportRepositories,
} from "../application/useDashboardReportData";
import type { DashboardClock } from "../application/dashboardPeriod";
import { DashboardPeriodControl } from "../components/DashboardPeriodControl";
import "./DashboardScreen.css";

export interface DashboardScreenProps {
  readonly clock?: DashboardClock;
  readonly repositories?: DashboardReportRepositories;
}

export interface DashboardOutletContext {
  readonly data: DashboardReportDataResult;
  readonly overview: DashboardOverviewModel | null;
}

export function DashboardScreen({
  clock,
  repositories = dashboardRepositories,
}: DashboardScreenProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { selection, setSelection } = useDashboardPeriodSearch(clock);
  const data = useDashboardReportData(selection.period, repositories);
  const overview = useMemo(
    () => (data.snapshot ? createDashboardOverviewModel(data.snapshot) : null),
    [data.snapshot],
  );
  const outletContext = useMemo<DashboardOutletContext>(
    () => ({ data, overview }),
    [data, overview],
  );
  const activeTabKey = location.pathname === "/reports" ? "/reports" : "/";

  return (
    <TabbedScreenLayout
      activeTabKey={activeTabKey}
      className="dashboard-screen"
      description={t("dashboard.description")}
      onTabChange={(path) => navigate({ pathname: path, search: location.search })}
      tabAriaLabel={t("dashboard.tabs.label")}
      tabs={[
        { key: "/", label: t("dashboard.tabs.overview") },
        { key: "/reports", label: t("dashboard.tabs.reports") },
      ]}
      title={t("dashboard.title")}
      titleId="dashboard-title"
    >
      <DashboardPeriodControl
        {...(clock ? { clock } : {})}
        onChange={setSelection}
        selection={selection}
      />
      <Outlet context={outletContext} />
    </TabbedScreenLayout>
  );
}
