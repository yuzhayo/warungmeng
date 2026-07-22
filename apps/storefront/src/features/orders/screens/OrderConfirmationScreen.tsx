import { Button, Result, Skeleton } from "antd";
import type { OrderRepository } from "@warungmeng/data";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import type { ReceiptStorageLike } from "../../checkout/application/recentOrderReceiptStorage";
import { storefrontOrderRepository } from "../../checkout/application/storefrontOrderRepository";
import { useOrderConfirmation } from "../application/useOrderConfirmation";
import { OrderConfirmationActions } from "../components/OrderConfirmationActions";
import { OrderConfirmationResult } from "../components/OrderConfirmationResult";
import { OrderItemSummary } from "../components/OrderItemSummary";
import { OrderStatusProgress } from "../components/OrderStatusProgress";
import { OrderTotalsSummary } from "../components/OrderTotalsSummary";
import styles from "../OrderConfirmation.module.css";

function defaultReceiptStorage(): ReceiptStorageLike | null {
  return typeof window === "undefined" ? null : window.sessionStorage;
}

interface OrderConfirmationScreenProps {
  readonly orderRepository?: OrderRepository;
  readonly receiptStorage?: ReceiptStorageLike | null;
}

export function OrderConfirmationScreen({
  orderRepository = storefrontOrderRepository,
  receiptStorage = defaultReceiptStorage(),
}: OrderConfirmationScreenProps) {
  const { orderId } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const state = useOrderConfirmation(orderId, orderRepository, receiptStorage);

  if (state.status === "loading") {
    return (
      <div className={styles.shell} role="status" aria-label={t("storefront.order.loading")}>
        <Skeleton active title paragraph={{ rows: 7 }} />
      </div>
    );
  }

  if (state.status === "not-found") {
    return (
      <div className={styles.shell}>
        <Result
          status="404"
          title={t("storefront.order.notFound.title")}
          subTitle={t("storefront.order.notFound.description")}
          extra={
            <Button type="primary" onClick={() => navigate("/")}>
              {t("storefront.order.actions.catalog")}
            </Button>
          }
        />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className={styles.shell}>
        <Result
          status="error"
          title={t("storefront.order.error.title")}
          subTitle={t("storefront.order.error.description")}
          extra={[
            <Button key="retry" type="primary" onClick={state.retry}>
              {t("storefront.error.retry")}
            </Button>,
            <Button key="catalog" onClick={() => navigate("/")}>
              {t("storefront.order.actions.catalog")}
            </Button>,
          ]}
        />
      </div>
    );
  }

  const order = state.order;
  return (
    <div className={styles.shell}>
      <OrderConfirmationResult order={order} />
      <OrderStatusProgress order={order} />
      <div className={styles.summaryGrid}>
        <OrderItemSummary items={order.items} />
        <OrderTotalsSummary order={order} />
      </div>
      <OrderConfirmationActions />
    </div>
  );
}
