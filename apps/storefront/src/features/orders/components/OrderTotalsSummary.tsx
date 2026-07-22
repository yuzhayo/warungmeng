import { Card } from "antd";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import type { OrderConfirmationView } from "../application/orderConfirmationModel";
import styles from "../OrderConfirmation.module.css";

interface OrderTotalsSummaryProps {
  readonly order: OrderConfirmationView;
}

export function OrderTotalsSummary({ order }: OrderTotalsSummaryProps) {
  const { t } = useTranslation();
  return (
    <Card title={t("storefront.order.totals.title")} size="small">
      <dl className={styles.totalsList}>
        <div className={styles.totalsRow}>
          <dt>{t("storefront.order.totals.subtotal")}</dt>
          <dd>{formatRupiah(order.subtotal, { regionalFormat: "id-ID" })}</dd>
        </div>
        <div className={`${styles.totalsRow} ${styles.totalRow}`}>
          <dt>{t("storefront.order.totals.total")}</dt>
          <dd>{formatRupiah(order.total, { regionalFormat: "id-ID" })}</dd>
        </div>
      </dl>
    </Card>
  );
}
