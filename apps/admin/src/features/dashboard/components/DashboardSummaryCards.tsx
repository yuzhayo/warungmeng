import { Card, Col, Row, Statistic } from "antd";
import { formatRupiah } from "@warungmeng/i18n";
import type { DashboardSummary } from "@warungmeng/domain";
import { useTranslation } from "react-i18next";

export interface DashboardSummaryCardsProps {
  readonly summary: DashboardSummary;
}

const rupiah = (amount: number) => formatRupiah(amount, { regionalFormat: "id-ID" });

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const { t } = useTranslation();
  const cards = [
    {
      key: "revenue",
      title: t("dashboard.kpi.netRevenue"),
      value: rupiah(summary.netRevenue.amount),
    },
    { key: "expenses", title: t("dashboard.kpi.expenses"), value: rupiah(summary.expenses.amount) },
    {
      key: "cashflow",
      title: t("dashboard.kpi.netCashflow"),
      value: rupiah(summary.netCashflow.amount),
    },
    { key: "orders", title: t("dashboard.kpi.paidOrders"), value: summary.paidOrderCount },
    {
      key: "aov",
      title: t("dashboard.kpi.averageOrderValue"),
      value: rupiah(summary.averageOrderValue.amount),
    },
    {
      key: "margin",
      title: t("dashboard.kpi.estimatedGrossMargin"),
      value: summary.estimatedGrossMarginPercentage,
      suffix: "%",
    },
    {
      key: "cancellation",
      title: t("dashboard.kpi.cancellationRate"),
      value: summary.cancellationRate,
      suffix: "%",
    },
    { key: "stock", title: t("dashboard.kpi.lowStock"), value: summary.lowStockIngredientCount },
  ] as const;

  return (
    <Row gutter={[16, 16]}>
      {cards.map((card) => (
        <Col key={card.key} xs={24} sm={12} xl={6}>
          <Card className="dashboard-kpi-card" size="small">
            <Statistic
              title={card.title}
              value={card.value}
              suffix={"suffix" in card ? card.suffix : undefined}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
