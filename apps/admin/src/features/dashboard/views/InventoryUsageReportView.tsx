import { Card, Empty, Table, Tag, Tooltip, Typography, type TableColumnsType } from "antd";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import type { InventoryUsageRow } from "@warungmeng/domain";
import { useTranslation } from "react-i18next";
import {
  compareInventoryUsageByQuantity,
  type DashboardReportsModel,
} from "../application/dashboardReportsModel";

export interface InventoryUsageReportViewProps {
  readonly model: DashboardReportsModel;
}

const { Text } = Typography;
const money = (amount: number) => formatRupiah(amount, { regionalFormat: "id-ID" });

export function InventoryUsageReportView({ model }: InventoryUsageReportViewProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const number = new Intl.NumberFormat(regionalFormat, { maximumFractionDigits: 3 });
  const empty = (
    <Empty
      description={t("dashboard.reports.empty.inventory")}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  );

  const columns: TableColumnsType<InventoryUsageRow> = [
    {
      dataIndex: "ingredientName",
      key: "ingredientName",
      title: t("dashboard.reports.column.ingredient"),
      width: 230,
      render: (value: string) => (
        <Tooltip title={value}>
          <Text className="dashboard-report-name" strong>
            {value}
          </Text>
        </Tooltip>
      ),
    },
    {
      dataIndex: "quantityUsed",
      key: "quantityUsed",
      title: t("dashboard.reports.column.quantityUsed"),
      width: 160,
      align: "right",
      sorter: compareInventoryUsageByQuantity,
      render: (value: number) => number.format(value),
    },
    {
      dataIndex: "unit",
      key: "unit",
      title: t("dashboard.reports.column.unit"),
      width: 110,
    },
    {
      key: "estimatedUsageValue",
      title: t("dashboard.reports.column.estimatedUsageValue"),
      width: 210,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.estimatedUsageValue.amount)}</span>
      ),
    },
    {
      dataIndex: "currentStock",
      key: "currentStock",
      title: t("dashboard.reports.column.currentStock"),
      width: 150,
      align: "right",
      render: (value: number) => number.format(value),
    },
    {
      dataIndex: "minimumStock",
      key: "minimumStock",
      title: t("dashboard.reports.column.minimumStock"),
      width: 150,
      align: "right",
      render: (value: number) => number.format(value),
    },
    {
      dataIndex: "lowStock",
      key: "lowStock",
      title: t("dashboard.reports.column.stockStatus"),
      width: 160,
      render: (lowStock: boolean) => (
        <Tag color={lowStock ? "warning" : "success"}>
          {t(
            lowStock
              ? "dashboard.reports.status.stockLow"
              : "dashboard.reports.status.stockHealthy",
          )}
        </Tag>
      ),
    },
  ];

  if (model.isInventoryEmpty) return <Card>{empty}</Card>;

  return (
    <Card className="dashboard-report-table-card" title={t("dashboard.reports.inventory.usage")}>
      <Table
        columns={columns}
        dataSource={[...model.inventoryUsage]}
        locale={{ emptyText: empty }}
        pagination={false}
        rowKey="ingredientId"
        scroll={{ x: 1_170 }}
      />
    </Card>
  );
}
