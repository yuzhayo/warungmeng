import { Select, Tabs } from "antd";
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
  const items = [
    { key: "sales", label: t("dashboard.reports.tabs.sales") },
    { key: "menu", label: t("dashboard.reports.tabs.menu") },
    { key: "inventory", label: t("dashboard.reports.tabs.inventory") },
  ];

  const handleChange = (key: string) => {
    if (isDashboardReportView(key)) onChange(key);
  };

  return (
    <div className="dashboard-report-navigation">
      <Tabs
        activeKey={activeReport}
        aria-label={t("dashboard.reports.tabs.label")}
        className="dashboard-report-navigation-desktop"
        items={items}
        onChange={handleChange}
      />
      <Select
        aria-label={t("dashboard.reports.tabs.label")}
        className="dashboard-report-navigation-mobile"
        onChange={handleChange}
        options={items.map((item) => ({ label: item.label, value: item.key }))}
        value={activeReport}
      />
    </div>
  );
}
