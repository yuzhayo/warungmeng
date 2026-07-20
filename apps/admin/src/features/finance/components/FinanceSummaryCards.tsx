import type { FinanceSummary } from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Card, Statistic } from "antd";
import { useTranslation } from "react-i18next";

interface FinanceSummaryCardsProps {
  readonly loading?: boolean;
  readonly summary: FinanceSummary;
}

export function FinanceSummaryCards({ loading = false, summary }: FinanceSummaryCardsProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const cards = [
    { key: "inflow", label: t("finance.summary.inflow"), value: summary.totalInflow.amount },
    { key: "outflow", label: t("finance.summary.outflow"), value: summary.totalOutflow.amount },
    { key: "net", label: t("finance.summary.net"), value: summary.netCashflow.amount },
    { key: "cash", label: t("finance.summary.cash"), value: summary.cashBalance.amount },
  ];

  return (
    <div className="finance-summary-cards">
      {cards.map((card) => (
        <Card className={`finance-summary-card finance-summary-card--${card.key}`} key={card.key}>
          <Statistic
            formatter={() => formatRupiah(card.value, { regionalFormat })}
            loading={loading}
            title={card.label}
            value={card.value}
          />
        </Card>
      ))}
    </div>
  );
}
