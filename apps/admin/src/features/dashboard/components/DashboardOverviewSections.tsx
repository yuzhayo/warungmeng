import { Card, Col, List, Row, Tag, Typography } from "antd";
import { formatDate, formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import type { DashboardOverviewModel } from "../application/dashboardOverviewModel";
import { useTranslation } from "react-i18next";

export interface DashboardOverviewSectionsProps {
  readonly model: DashboardOverviewModel;
}

const { Text } = Typography;
const rupiah = (amount: number) => formatRupiah(amount, { regionalFormat: "id-ID" });

export function DashboardOverviewSections({ model }: DashboardOverviewSectionsProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const recentTrend = model.dailySalesTrend.slice(-7);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card title={t("dashboard.section.salesTrend")}>
          <List
            dataSource={recentTrend}
            locale={{ emptyText: t("dashboard.empty.description") }}
            renderItem={(point) => (
              <List.Item extra={<Text strong>{rupiah(point.netRevenue.amount)}</Text>}>
                <List.Item.Meta
                  description={t("dashboard.section.paidOrderCount", {
                    count: point.paidOrderCount,
                  })}
                  title={formatDate(new Date(`${point.date}T12:00:00.000Z`), {
                    regionalFormat,
                  })}
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title={t("dashboard.section.paymentMethods")}>
          <List
            dataSource={[...model.paymentMethods]}
            locale={{ emptyText: t("dashboard.empty.description") }}
            renderItem={(item) => (
              <List.Item extra={<Text strong>{rupiah(item.netCashflow.amount)}</Text>}>
                <List.Item.Meta
                  description={t("dashboard.section.transactionCount", {
                    count: item.transactionCount,
                  })}
                  title={t(`dashboard.payment.${item.paymentMethod}`)}
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title={t("dashboard.section.orderChannels")}>
          <List
            dataSource={[...model.orderChannels]}
            locale={{ emptyText: t("dashboard.empty.description") }}
            renderItem={(item) => (
              <List.Item extra={<Text strong>{rupiah(item.netRevenue.amount)}</Text>}>
                <List.Item.Meta
                  description={t("dashboard.section.paidOrderCount", {
                    count: item.paidOrderCount,
                  })}
                  title={t(`dashboard.channel.${item.channel}`)}
                />
              </List.Item>
            )}
          />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title={t("dashboard.section.lowStock")}>
          <List
            dataSource={model.lowStockIngredients.slice(0, 5)}
            locale={{ emptyText: t("dashboard.section.stockHealthy") }}
            renderItem={(item) => (
              <List.Item
                extra={
                  <Tag color="warning">
                    {item.currentStock} / {item.minimumStock} {item.unit}
                  </Tag>
                }
              >
                <Text>{item.ingredientName}</Text>
              </List.Item>
            )}
          />
        </Card>
      </Col>
    </Row>
  );
}
