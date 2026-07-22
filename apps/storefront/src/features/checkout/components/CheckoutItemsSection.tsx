import { Card, Typography } from "antd";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import {
  calculateCartItemLineTotal,
  type StorefrontCartItem,
} from "../../cart/application/storefrontCartModel";
import styles from "../Checkout.module.css";

interface CheckoutItemsSectionProps {
  readonly items: readonly StorefrontCartItem[];
}

export function CheckoutItemsSection({ items }: CheckoutItemsSectionProps) {
  const { t } = useTranslation();

  return (
    <Card title={t("storefront.checkout.items.title")} size="small">
      <ul className={styles.itemList}>
        {items.map((item) => {
          const options = item.variantSelections
            .map((selection) => selection.optionName)
            .join(", ");
          return (
            <li key={item.id} className={styles.itemRow}>
              <div className={styles.itemMain}>
                <Typography.Text strong>{`${item.quantity}× ${item.name}`}</Typography.Text>
                <div className={styles.itemDescription}>
                  {options ? <span>{options}</span> : null}
                  {item.note ? (
                    <span>{t("storefront.cart.note.prefix", { note: item.note })}</span>
                  ) : null}
                </div>
              </div>
              <div>
                <Typography.Text strong>
                  {formatRupiah(calculateCartItemLineTotal(item), { regionalFormat: "id-ID" })}
                </Typography.Text>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
