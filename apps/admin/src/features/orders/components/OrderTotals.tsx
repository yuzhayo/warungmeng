import type { OrderTotals as OrderTotalsValue } from "@warungmeng/domain";
import { formatRupiah, useLocaleSettings } from "@warungmeng/i18n";
import { Typography } from "antd";
import { useTranslation } from "react-i18next";

export function OrderTotals({ totals }: { readonly totals: OrderTotalsValue }) {
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const rows = [
    [t("orders.detail.subtotal"), totals.subtotal.amount],
    [t("orders.detail.discount"), -totals.discount.amount],
    [t("orders.detail.tax"), totals.tax.amount],
    [t("orders.detail.serviceCharge"), totals.serviceCharge.amount],
  ] as const;

  return (
    <div className="order-detail__totals">
      {rows.map(([label, amount]) => (
        <div key={label}>
          <span>{label}</span>
          <span>{formatRupiah(amount, { regionalFormat })}</span>
        </div>
      ))}
      <div className="order-detail__total-final">
        <Typography.Text strong>{t("orders.detail.total")}</Typography.Text>
        <Typography.Text strong>
          {formatRupiah(totals.total.amount, { regionalFormat })}
        </Typography.Text>
      </div>
    </div>
  );
}
