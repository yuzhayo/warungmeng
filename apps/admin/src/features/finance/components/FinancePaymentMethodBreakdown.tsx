import type { FinancePaymentMethodSummary } from "@warungmeng/domain";
import { formatRupiah, type TranslationKey, useLocaleSettings } from "@warungmeng/i18n";
import { Card, Empty, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface FinancePaymentMethodBreakdownProps {
  readonly paymentMethods: readonly FinancePaymentMethodSummary[];
}

export function FinancePaymentMethodBreakdown({
  paymentMethods,
}: FinancePaymentMethodBreakdownProps) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();

  return (
    <Card title={t("finance.breakdown.paymentMethods")}>
      {paymentMethods.length === 0 ? (
        <Empty description={t("finance.breakdown.empty")} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="finance-payment-list">
          {paymentMethods.map((method) => (
            <div className="finance-payment-row" key={method.paymentMethod}>
              <div>
                <Typography.Text strong>
                  {t(`finance.payment.${method.paymentMethod}` as TranslationKey)}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {t("finance.breakdown.transactionCount", {
                    count: method.transactionCount,
                  })}
                </Typography.Text>
              </div>
              <Typography.Text strong>
                {formatRupiah(method.netCashflow.amount, { regionalFormat })}
              </Typography.Text>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
