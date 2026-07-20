import { Card, Empty, Space, Table, Tag, Tooltip, Typography, type TableColumnsType } from "antd";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import type { CategoryPerformanceRow, MenuPerformanceRow } from "@warungmeng/domain";
import { useTranslation } from "react-i18next";
import {
  compareCategoryPerformanceByNetSales,
  compareMenuPerformanceByQuantity,
  type DashboardReportsModel,
} from "../application/dashboardReportsModel";

export interface MenuPerformanceReportViewProps {
  readonly model: DashboardReportsModel;
}

const { Text } = Typography;
const money = (amount: number) => formatRupiah(amount, { regionalFormat: "id-ID" });

export function MenuPerformanceReportView({ model }: MenuPerformanceReportViewProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const number = new Intl.NumberFormat(regionalFormat);
  const percent = new Intl.NumberFormat(regionalFormat, { maximumFractionDigits: 2 });
  const empty = (
    <Empty description={t("dashboard.reports.empty.menu")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );

  const menuColumns: TableColumnsType<MenuPerformanceRow> = [
    {
      dataIndex: "menuName",
      key: "menuName",
      title: t("dashboard.reports.column.menu"),
      width: 220,
      render: (value: string) => (
        <Tooltip title={value}>
          <Text className="dashboard-report-name" strong>
            {value}
          </Text>
        </Tooltip>
      ),
    },
    {
      dataIndex: "categoryName",
      key: "categoryName",
      title: t("dashboard.reports.column.category"),
      width: 170,
      render: (value: string | null) => value ?? t("dashboard.reports.unknownCategory"),
    },
    {
      dataIndex: "quantitySold",
      key: "quantitySold",
      title: t("dashboard.reports.column.quantitySold"),
      width: 150,
      align: "right",
      sorter: compareMenuPerformanceByQuantity,
      render: (value: number) => number.format(value),
    },
    {
      key: "netSales",
      title: t("dashboard.reports.column.netSales"),
      width: 170,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.netSales.amount)}</span>
      ),
    },
    {
      key: "estimatedCogs",
      title: t("dashboard.reports.column.estimatedCogs"),
      width: 170,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.estimatedCogs.amount)}</span>
      ),
    },
    {
      key: "estimatedGrossProfit",
      title: t("dashboard.reports.column.estimatedGrossProfit"),
      width: 190,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.estimatedGrossProfit.amount)}</span>
      ),
    },
    {
      dataIndex: "estimatedGrossMarginPercentage",
      key: "estimatedGrossMarginPercentage",
      title: t("dashboard.reports.column.estimatedMargin"),
      width: 160,
      align: "right",
      render: (value: number) => `${percent.format(value)}%`,
    },
    {
      dataIndex: "missingCost",
      key: "missingCost",
      title: t("dashboard.reports.column.costStatus"),
      width: 170,
      render: (missing: boolean) => (
        <Tag color={missing ? "warning" : "success"}>
          {t(
            missing
              ? "dashboard.reports.status.costMissing"
              : "dashboard.reports.status.costComplete",
          )}
        </Tag>
      ),
    },
  ];

  const categoryColumns: TableColumnsType<CategoryPerformanceRow> = [
    {
      dataIndex: "categoryName",
      key: "categoryName",
      title: t("dashboard.reports.column.category"),
      width: 210,
      render: (value: string | null) => value ?? t("dashboard.reports.unknownCategory"),
    },
    {
      dataIndex: "quantitySold",
      key: "quantitySold",
      title: t("dashboard.reports.column.quantitySold"),
      width: 150,
      align: "right",
      render: (value: number) => number.format(value),
    },
    {
      key: "netSales",
      title: t("dashboard.reports.column.netSales"),
      width: 170,
      align: "right",
      sorter: compareCategoryPerformanceByNetSales,
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.netSales.amount)}</span>
      ),
    },
    {
      key: "estimatedCogs",
      title: t("dashboard.reports.column.estimatedCogs"),
      width: 170,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.estimatedCogs.amount)}</span>
      ),
    },
    {
      key: "estimatedGrossProfit",
      title: t("dashboard.reports.column.estimatedGrossProfit"),
      width: 190,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.estimatedGrossProfit.amount)}</span>
      ),
    },
    {
      dataIndex: "estimatedGrossMarginPercentage",
      key: "estimatedGrossMarginPercentage",
      title: t("dashboard.reports.column.estimatedMargin"),
      width: 160,
      align: "right",
      render: (value: number) => `${percent.format(value)}%`,
    },
    {
      dataIndex: "missingCostItemCount",
      key: "missingCostItemCount",
      title: t("dashboard.reports.column.missingCostCount"),
      width: 160,
      align: "right",
      render: (value: number) =>
        value > 0 ? <Tag color="warning">{number.format(value)}</Tag> : number.format(value),
    },
  ];

  if (model.isMenuEmpty) return <Card>{empty}</Card>;

  return (
    <Space className="dashboard-report-view" orientation="vertical" size="large">
      <Card className="dashboard-report-table-card" title={t("dashboard.reports.menu.items")}>
        <Table
          columns={menuColumns}
          dataSource={[...model.menuPerformance]}
          locale={{ emptyText: empty }}
          pagination={false}
          rowKey="menuItemId"
          scroll={{ x: 1_400 }}
        />
      </Card>
      <Card className="dashboard-report-table-card" title={t("dashboard.reports.menu.categories")}>
        <Table
          columns={categoryColumns}
          dataSource={[...model.categoryPerformance]}
          locale={{ emptyText: empty }}
          pagination={false}
          rowKey={(row) => row.categoryId ?? "unknown-category"}
          scroll={{ x: 1_200 }}
        />
      </Card>
    </Space>
  );
}
