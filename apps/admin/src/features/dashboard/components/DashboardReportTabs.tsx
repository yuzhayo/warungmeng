import { Tabs } from "antd";
import { useTranslation } from "react-i18next";
import {
  isDashboardReportView,
  type DashboardReportView,
} from "../application/dashboardReportView";

export interface DashboardReportTabsProps {
  readonly activeReport: DashboardReportView;
  readonly onChange: (report: DashboardReportView) => void;
}

export function DashboardReportTabs({ activeReport, onChange }: DashboardReportTabsProps) {
  const { t } = useTranslation();

  return (
    <Tabs
      activeKey={activeReport}
      aria-label={t("dashboard.reports.tabs.label")}
      items={[
        { key: "sales", label: t("dashboard.reports.tabs.sales") },
        { key: "menu", label: t("dashboard.reports.tabs.menu") },
        { key: "inventory", label: t("dashboard.reports.tabs.inventory") },
      ]}
      onChange={(key) => {
        if (isDashboardReportView(key)) onChange(key);
      }}
    />
  );
}
