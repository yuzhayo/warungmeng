import { Card } from "antd";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import type { OrderConfirmationView } from "../application/orderConfirmationModel";
import styles from "../OrderConfirmation.module.css";

interface OrderItemSummaryProps {
  readonly items: OrderConfirmationView["items"];
}

export function OrderItemSummary({ items }: OrderItemSummaryProps) {
  const { t } = useTranslation();

  return (
    <Card title={t("storefront.order.items.title")} size="small">
      <ul className={styles.itemList}>
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className={styles.itemListEntry}>
            <div className={styles.itemRow}>
              <div className={styles.itemIdentity}>
                <strong>{item.name}</strong>
                <span className={styles.secondaryText}>
                  {t("storefront.order.items.quantity", { quantity: item.quantity })}
                </span>
                {item.optionNames.length > 0 ? (
                  <span className={styles.secondaryText}>{item.optionNames.join(", ")}</span>
                ) : null}
              </div>
              <strong className={styles.money}>
                {formatRupiah(item.lineTotal, { regionalFormat: "id-ID" })}
              </strong>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
