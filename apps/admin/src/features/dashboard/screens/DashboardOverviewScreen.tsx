import { Space } from "antd";
import { useOutletContext } from "react-router-dom";
import { DashboardDataState } from "../components/DashboardDataState";
import { DashboardOverviewSections } from "../components/DashboardOverviewSections";
import { DashboardSummaryCards } from "../components/DashboardSummaryCards";
import type { DashboardOutletContext } from "./DashboardScreen";

export function DashboardOverviewScreen() {
  const { data, overview } = useOutletContext<DashboardOutletContext>();

  return (
    <DashboardDataState
      data={data}
      isEmpty={overview?.isEmpty ?? false}
      missingCostItemCount={overview?.summary.missingCostItemCount ?? 0}
    >
      {overview ? (
        <Space className="dashboard-overview" orientation="vertical" size="large">
          <DashboardSummaryCards summary={overview.summary} />
          <DashboardOverviewSections model={overview} />
        </Space>
      ) : null}
    </DashboardDataState>
  );
}
