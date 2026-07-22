import { Steps } from "antd";
import { useTranslation } from "react-i18next";
import {
  ACTIVE_ORDER_STATUSES,
  getOrderStatusPresentation,
  type OrderConfirmationView,
} from "../application/orderConfirmationModel";
import styles from "../OrderConfirmation.module.css";

interface OrderStatusProgressProps {
  readonly order: OrderConfirmationView;
}

export function OrderStatusProgress({ order }: OrderStatusProgressProps) {
  const { t } = useTranslation();
  const presentation = getOrderStatusPresentation(order.status);
  if (presentation.cancelled) return null;

  return (
    <section className={styles.section} aria-labelledby="storefront-order-progress-title">
      <h2 id="storefront-order-progress-title" className={styles.sectionTitle}>
        {t("storefront.order.progress.title")}
      </h2>
      <Steps
        size="small"
        responsive
        current={presentation.progressIndex}
        items={ACTIVE_ORDER_STATUSES.map((status) => ({
          title: t(`storefront.order.status.${status}`),
        }))}
      />
    </section>
  );
}
