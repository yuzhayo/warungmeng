import type { OrderPaymentStatus, OrderStatus } from "@warungmeng/domain";
import { Tag } from "antd";
import { useTranslation } from "react-i18next";

const STATUS_COLORS: Readonly<Record<OrderStatus, string>> = {
  new: "gold",
  accepted: "blue",
  preparing: "cyan",
  ready: "green",
  completed: "default",
  cancelled: "red",
};

const PAYMENT_COLORS: Readonly<Record<OrderPaymentStatus, string>> = {
  unpaid: "orange",
  paid: "green",
  refunded: "purple",
};

export function OrderStatusTag({ status }: { readonly status: OrderStatus }) {
  const { t } = useTranslation();
  return <Tag color={STATUS_COLORS[status]}>{t(`orders.status.${status}`)}</Tag>;
}

export function OrderPaymentStatusTag({ status }: { readonly status: OrderPaymentStatus }) {
  const { t } = useTranslation();
  return <Tag color={PAYMENT_COLORS[status]}>{t(`orders.payment.${status}`)}</Tag>;
}
