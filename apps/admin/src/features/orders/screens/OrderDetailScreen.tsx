import { ArrowLeftOutlined } from "@ant-design/icons";
import type { InventoryRepository, OrderRepository } from "@warungmeng/data";
import { getAllowedOrderStatusTransitions, type OrderStatus } from "@warungmeng/domain";
import { formatDate, formatTime, useLocaleSettings } from "@warungmeng/i18n";
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Flex,
  Popconfirm,
  Result,
  Spin,
  Timeline,
} from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { inventoryRepository } from "../../inventory/application/inventoryRepository";
import { orderRepository } from "../application/orderRepository";
import { useOrderDetail } from "../application/useOrderDetail";
import { OrderDetailItemsTable } from "../components/OrderDetailItemsTable";
import { OrderPaymentStatusTag, OrderStatusTag } from "../components/OrderStatusTag";
import { OrderTotals } from "../components/OrderTotals";
import "./OrderDetailScreen.css";

export interface OrderDetailScreenProps {
  readonly repository?: OrderRepository;
  readonly inventory?: InventoryRepository;
}

export function OrderDetailScreen({
  repository = orderRepository,
  inventory = inventoryRepository,
}: OrderDetailScreenProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const { regionalFormat } = useLocaleSettings();
  const navigate = useNavigate();
  const { orderId = "" } = useParams();
  const detail = useOrderDetail(repository, orderId, inventory);

  async function handleStatusChange(nextStatus: OrderStatus): Promise<void> {
    try {
      const result = await detail.updateStatus(nextStatus);
      if (result.status === "updated") {
        void message.success(t("orders.feedback.statusUpdated"));
      } else if (result.status === "invalid-transition") {
        void message.warning(t("orders.feedback.invalidTransition"));
      } else {
        void message.error(t("orders.error.notFound"));
      }
    } catch {
      void message.error(t("orders.feedback.updateFailed"));
    }
  }

  async function handleCancelOrder(): Promise<void> {
    try {
      const outcome = await detail.cancelOrder();
      if (outcome.result.status === "not-found") {
        void message.error(t("orders.error.notFound"));
        return;
      }
      if (outcome.result.status === "invalid-transition" && !outcome.refunded) {
        void message.warning(t("orders.feedback.invalidTransition"));
        return;
      }
      if (outcome.stockReversalFailed) {
        void message.warning(t("orders.feedback.stockReversalFailed"));
        return;
      }
      void message.success(
        t(outcome.refunded ? "orders.feedback.cancelledRefunded" : "orders.feedback.statusUpdated"),
      );
    } catch {
      void message.error(t("orders.feedback.updateFailed"));
    }
  }

  if (detail.loading) {
    return (
      <div className="order-detail__loading">
        <Spin size="large" />
      </div>
    );
  }

  if (detail.error) {
    return (
      <Alert
        action={<Button onClick={detail.retry}>{t("orders.actions.retry")}</Button>}
        showIcon
        title={t("orders.error.loadDetail")}
        type="error"
      />
    );
  }

  if (detail.notFound || !detail.order) {
    return (
      <Result
        extra={<Button onClick={() => navigate("/orders")}>{t("orders.actions.back")}</Button>}
        status="404"
        subTitle={t("orders.error.notFoundDescription")}
        title={t("orders.error.notFound")}
      />
    );
  }

  const { order } = detail;
  const createdAt = new Date(order.createdAt);
  const allowedTransitions = getAllowedOrderStatusTransitions(order.status);
  const forwardStatus = allowedTransitions.find((status) => status !== "cancelled");
  const canCancel = allowedTransitions.includes("cancelled");

  return (
    <section aria-labelledby="order-detail-title" className="order-detail">
      <header className="order-detail__header">
        <Flex align="center" gap="middle" wrap>
          <Button
            aria-label={t("orders.actions.back")}
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/orders")}
          />
          <div>
            <h1 id="order-detail-title">{order.orderNumber}</h1>
            <p>{t("orders.detail.title")}</p>
          </div>
          <OrderStatusTag status={order.status} />
        </Flex>

        <Flex gap="small" wrap>
          {canCancel ? (
            <Popconfirm
              cancelText={t("orders.actions.keep")}
              description={t(
                order.paymentStatus === "paid"
                  ? "orders.confirm.cancelPaidDescription"
                  : "orders.confirm.cancelDescription",
              )}
              okButtonProps={{ danger: true, loading: detail.updating }}
              okText={t("orders.actions.cancelOrder")}
              onConfirm={() => handleCancelOrder()}
              title={t("orders.confirm.cancelTitle")}
            >
              <Button danger disabled={detail.updating}>
                {t("orders.actions.cancelOrder")}
              </Button>
            </Popconfirm>
          ) : null}
          {forwardStatus ? (
            <Button
              loading={detail.updating}
              onClick={() => handleStatusChange(forwardStatus)}
              type="primary"
            >
              {t(`orders.actions.transition.${forwardStatus}`)}
            </Button>
          ) : null}
        </Flex>
      </header>

      <Card title={t("orders.detail.summary")}>
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { key: "outlet", label: t("orders.table.outlet"), children: order.outletName },
            {
              key: "createdAt",
              label: t("orders.table.createdAt"),
              children: `${formatDate(createdAt, { regionalFormat })} ${formatTime(createdAt, { regionalFormat })}`,
            },
            {
              key: "channel",
              label: t("orders.table.channel"),
              children: t(`orders.channel.${order.channel}`),
            },
            {
              key: "fulfillment",
              label: t("orders.detail.fulfillment"),
              children: t(`orders.fulfillment.${order.fulfillment}`),
            },
            {
              key: "payment",
              label: t("orders.table.payment"),
              children: <OrderPaymentStatusTag status={order.paymentStatus} />,
            },
            {
              key: "paymentMethod",
              label: t("orders.detail.paymentMethod"),
              children: t(`orders.paymentMethod.${order.paymentMethod}`),
            },
            {
              key: "customer",
              label: t("orders.table.customer"),
              children: order.customer?.name || t("orders.customer.walkIn"),
            },
          ]}
          size="small"
        />
      </Card>

      <div className="order-detail__grid">
        <Card className="order-detail__items" title={t("orders.detail.items")}>
          <OrderDetailItemsTable items={order.items} />
        </Card>
        <Card title={t("orders.detail.paymentSummary")}>
          <OrderTotals totals={order.totals} />
        </Card>
        <Card title={t("orders.detail.notes")}>
          <dl className="order-detail__notes">
            <div>
              <dt>{t("orders.detail.customerNote")}</dt>
              <dd>{order.customerNote || t("orders.detail.noNote")}</dd>
            </div>
            <div>
              <dt>{t("orders.detail.internalNote")}</dt>
              <dd>{order.internalNote || t("orders.detail.noNote")}</dd>
            </div>
          </dl>
        </Card>
        <Card title={t("orders.detail.history")}>
          <Timeline
            items={[...order.events].reverse().map((event) => {
              const occurredAt = new Date(event.occurredAt);
              return {
                key: event.id,
                title: t(`orders.status.${event.status}`),
                content: `${formatDate(occurredAt, { regionalFormat })} ${formatTime(occurredAt, { regionalFormat })}`,
              };
            })}
          />
        </Card>
      </div>
    </section>
  );
}
