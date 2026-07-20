import {
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Table,
  Typography,
  type TableColumnsType,
} from "antd";
import { formatDate, formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import type { DailySalesTrendPoint, PeakSalesHourRow } from "@warungmeng/domain";
import { useTranslation } from "react-i18next";
import {
  compareDailySalesByDate,
  type DashboardReportsModel,
} from "../application/dashboardReportsModel";

export interface SalesReportViewProps {
  readonly model: DashboardReportsModel;
}

const { Text } = Typography;
const money = (amount: number) => formatRupiah(amount, { regionalFormat: "id-ID" });

export function SalesReportView({ model }: SalesReportViewProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const empty = (
    <Empty description={t("dashboard.reports.empty.sales")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );

  const dailyColumns: TableColumnsType<DailySalesTrendPoint> = [
    {
      dataIndex: "date",
      key: "date",
      sorter: compareDailySalesByDate,
      title: t("dashboard.reports.column.date"),
      width: 150,
      render: (date: string) => formatDate(new Date(`${date}T12:00:00.000Z`), { regionalFormat }),
    },
    {
      key: "grossSales",
      title: t("dashboard.reports.column.grossSales"),
      width: 170,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.grossSales.amount)}</span>
      ),
    },
    {
      key: "refunds",
      title: t("dashboard.reports.column.refunds"),
      width: 150,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.refunds.amount)}</span>
      ),
    },
    {
      key: "netRevenue",
      title: t("dashboard.reports.column.netRevenue"),
      width: 170,
      align: "right",
      render: (_, row) => (
        <Text strong className="dashboard-report-money">
          {money(row.netRevenue.amount)}
        </Text>
      ),
    },
    {
      dataIndex: "paidOrderCount",
      key: "paidOrderCount",
      title: t("dashboard.reports.column.paidOrders"),
      width: 140,
      align: "right",
    },
  ];

  const peakColumns: TableColumnsType<PeakSalesHourRow> = [
    {
      dataIndex: "hour",
      key: "hour",
      title: t("dashboard.reports.column.hour"),
      width: 150,
      render: (hour: number) => {
        const start = String(hour).padStart(2, "0");
        return `${start}.00–${start}.59`;
      },
    },
    {
      dataIndex: "paidOrderCount",
      key: "paidOrderCount",
      title: t("dashboard.reports.column.paidOrders"),
      width: 150,
      align: "right",
    },
    {
      key: "grossSales",
      title: t("dashboard.reports.column.grossSales"),
      width: 180,
      align: "right",
      render: (_, row) => (
        <span className="dashboard-report-money">{money(row.grossSales.amount)}</span>
      ),
    },
  ];

  if (model.isSalesEmpty) return <Card>{empty}</Card>;

  return (
    <Space className="dashboard-report-view" orientation="vertical" size="large">
      <Row className="dashboard-report-grid" gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card title={t("dashboard.reports.sales.paymentMethods")}>
            {model.paymentMethods.length > 0 ? (
              <Descriptions
                bordered
                column={1}
                items={model.paymentMethods.map((item) => ({
                  key: item.paymentMethod,
                  label: t(`dashboard.payment.${item.paymentMethod}`),
                  children: (
                    <Space>
                      <Text strong>{money(item.netCashflow.amount)}</Text>
                      <Text type="secondary">
                        {t("dashboard.section.transactionCount", {
                          count: item.transactionCount,
                        })}
                      </Text>
                    </Space>
                  ),
                }))}
                size="small"
              />
            ) : (
              empty
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title={t("dashboard.reports.sales.orderChannels")}>
            {model.orderChannels.length > 0 ? (
              <Descriptions
                bordered
                column={1}
                items={model.orderChannels.map((item) => ({
                  key: item.channel,
                  label: t(`dashboard.channel.${item.channel}`),
                  children: (
                    <Space>
                      <Text strong>{money(item.netRevenue.amount)}</Text>
                      <Text type="secondary">
                        {t("dashboard.section.paidOrderCount", {
                          count: item.paidOrderCount,
                        })}
                      </Text>
                    </Space>
                  ),
                }))}
                size="small"
              />
            ) : (
              empty
            )}
          </Card>
        </Col>
      </Row>

      <Card className="dashboard-report-table-card" title={t("dashboard.reports.sales.daily")}>
        <Table
          columns={dailyColumns}
          dataSource={[...model.dailySalesTrend]}
          locale={{ emptyText: empty }}
          pagination={false}
          rowKey="date"
          scroll={{ x: 780 }}
        />
      </Card>

      <Card className="dashboard-report-table-card" title={t("dashboard.reports.sales.peakHours")}>
        <Table
          columns={peakColumns}
          dataSource={[...model.peakSalesHours]}
          locale={{ emptyText: empty }}
          pagination={false}
          rowKey="hour"
          scroll={{ x: 480 }}
        />
      </Card>
    </Space>
  );
}
