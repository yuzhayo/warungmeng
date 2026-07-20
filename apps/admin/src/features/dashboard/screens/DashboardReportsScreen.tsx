import { Space } from "antd";
import { useMemo } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import {
  createDashboardReportsModel,
  type DashboardReportsModel,
} from "../application/dashboardReportsModel";
import {
  parseDashboardReportSearchParams,
  updateDashboardReportSearchParams,
  type DashboardReportView,
} from "../application/dashboardReportView";
import { DashboardDataState } from "../components/DashboardDataState";
import { DashboardReportTabs } from "../components/DashboardReportTabs";
import { InventoryUsageReportView } from "../views/InventoryUsageReportView";
import { MenuPerformanceReportView } from "../views/MenuPerformanceReportView";
import { SalesReportView } from "../views/SalesReportView";
import type { DashboardOutletContext } from "./DashboardScreen";
import "./DashboardReportsScreen.css";

function renderReport(report: DashboardReportView, model: DashboardReportsModel) {
  switch (report) {
    case "sales":
      return <SalesReportView model={model} />;
    case "menu":
      return <MenuPerformanceReportView model={model} />;
    case "inventory":
      return <InventoryUsageReportView model={model} />;
  }
}

export function DashboardReportsScreen() {
  const { data, overview } = useOutletContext<DashboardOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeReport = parseDashboardReportSearchParams(searchParams);
  const model = useMemo(
    () => (data.snapshot ? createDashboardReportsModel(data.snapshot) : null),
    [data.snapshot],
  );

  const handleReportChange = (report: DashboardReportView) => {
    setSearchParams(updateDashboardReportSearchParams(searchParams, report));
  };

  return (
    <Space className="dashboard-reports" orientation="vertical" size="large">
      <DashboardReportTabs activeReport={activeReport} onChange={handleReportChange} />
      <DashboardDataState
        data={data}
        isEmpty={false}
        missingCostItemCount={overview?.summary.missingCostItemCount ?? 0}
      >
        {model ? renderReport(activeReport, model) : null}
      </DashboardDataState>
    </Space>
  );
}
