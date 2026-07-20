import type { FinanceCategorySummary } from "@warungmeng/domain";
import { formatRupiah, type TranslationKey, useLocaleSettings } from "@warungmeng/i18n";
import { Card, Empty, Progress, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface FinanceExpenseBreakdownProps {
  readonly categories: readonly FinanceCategorySummary[];
  readonly total: number;
}

export function FinanceExpenseBreakdown({ categories, total }: FinanceExpenseBreakdownProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();

  return (
    <Card title={t("finance.breakdown.expenses")}>
      {categories.length === 0 ? (
        <Empty description={t("finance.breakdown.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="finance-breakdown-list">
          {categories.map((category) => {
            const label = category.categoryId.startsWith("custom:")
              ? category.categoryLabel
              : t(`finance.category.${category.categoryId}` as TranslationKey);
            const percent = total > 0 ? Math.round((category.total.amount / total) * 100) : 0;
            return (
              <div className="finance-breakdown-row" key={category.categoryId}>
                <div className="finance-breakdown-row__heading">
                  <span>{label}</span>
                  <Typography.Text strong>
                    {formatRupiah(category.total.amount, { regionalFormat })}
                  </Typography.Text>
                </div>
                <Progress
                  format={() =>
                    t("finance.breakdown.transactionCount", {
                      count: category.transactionCount,
                    })
                  }
                  percent={percent}
                  size="small"
                />
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
