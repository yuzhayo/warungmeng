import { Card, Col, Descriptions, Empty, Row, Tag, Typography } from "antd";
import type { DescriptionsProps } from "antd";
import { formatDate, formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import type { DashboardOverviewModel } from "../application/dashboardOverviewModel";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export interface DashboardOverviewSectionsProps {
  readonly model: DashboardOverviewModel;
}

const { Text } = Typography;
const rupiah = (amount: number) => formatRupiah(amount, { regionalFormat: "id-ID" });

interface OverviewEntry {
  readonly key: string;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly value: ReactNode;
}

interface OverviewEntriesProps {
  readonly emptyText: ReactNode;
  readonly entries: readonly OverviewEntry[];
}

function OverviewEntries({ emptyText, entries }: OverviewEntriesProps) {
  if (entries.length === 0) {
    return <Empty description={emptyText} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const items: DescriptionsProps["items"] = entries.map((entry) => ({
    key: entry.key,
    label: (
      <span className="dashboard-overview-entry-label">
        <Text>{entry.label}</Text>
        {entry.description ? <Text type="secondary">{entry.description}</Text> : null}
      </span>
    ),
    children: entry.value,
  }));

  return (
    <Descriptions
      className="dashboard-overview-entries"
      colon={false}
      column={1}
      items={items}
      size="small"
    />
  );
}

export function DashboardOverviewSections({ model }: DashboardOverviewSectionsProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const recentTrend = model.dailySalesTrend.slice(-7);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card title={t("dashboard.section.salesTrend")}>
          <OverviewEntries
            emptyText={t("dashboard.empty.description")}
            entries={recentTrend.map((point) => ({
              key: point.date,
              label: formatDate(new Date(`${point.date}T12:00:00.000Z`), {
                regionalFormat,
              }),
              description: t("dashboard.section.paidOrderCount", {
                count: point.paidOrderCount,
              }),
              value: <Text strong>{rupiah(point.netRevenue.amount)}</Text>,
            }))}
          />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title={t("dashboard.section.paymentMethods")}>
          <OverviewEntries
            emptyText={t("dashboard.empty.description")}
            entries={model.paymentMethods.map((item) => ({
              key: item.paymentMethod,
              label: t(`dashboard.payment.${item.paymentMethod}`),
              description: t("dashboard.section.transactionCount", {
                count: item.transactionCount,
              }),
              value: <Text strong>{rupiah(item.netCashflow.amount)}</Text>,
            }))}
          />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title={t("dashboard.section.orderChannels")}>
          <OverviewEntries
            emptyText={t("dashboard.empty.description")}
            entries={model.orderChannels.map((item) => ({
              key: item.channel,
              label: t(`dashboard.channel.${item.channel}`),
              description: t("dashboard.section.paidOrderCount", {
                count: item.paidOrderCount,
              }),
              value: <Text strong>{rupiah(item.netRevenue.amount)}</Text>,
            }))}
          />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title={t("dashboard.section.lowStock")}>
          <OverviewEntries
            emptyText={t("dashboard.section.stockHealthy")}
            entries={model.lowStockIngredients.slice(0, 5).map((item) => ({
              key: item.ingredientId,
              label: item.ingredientName,
              value: (
                <Tag color="warning">
                  {item.currentStock} / {item.minimumStock} {item.unit}
                </Tag>
              ),
            }))}
          />
        </Card>
      </Col>
    </Row>
  );
}
