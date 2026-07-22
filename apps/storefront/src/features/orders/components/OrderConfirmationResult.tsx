import { Result } from "antd";
import { formatDate, formatTime } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import {
  getOrderStatusPresentation,
  type OrderConfirmationView,
} from "../application/orderConfirmationModel";

interface OrderConfirmationResultProps {
  readonly order: OrderConfirmationView;
}

export function OrderConfirmationResult({ order }: OrderConfirmationResultProps) {
  const { t } = useTranslation();
  const presentation = getOrderStatusPresentation(order.status);
  const createdAt = new Date(order.createdAt);
  const createdLabel = Number.isNaN(createdAt.getTime())
    ? ""
    : `${formatDate(createdAt, { regionalFormat: "id-ID" })} ${formatTime(createdAt, {
        regionalFormat: "id-ID",
      })}`;

  return (
    <Result
      status={presentation.cancelled ? "error" : "success"}
      title={t(presentation.labelKey)}
      subTitle={
        <div>
          <div>{t("storefront.order.number", { number: order.orderNumber })}</div>
          <div>
            {t(`storefront.order.fulfillment.${order.fulfillment}`)}
            {createdLabel ? ` • ${createdLabel}` : ""}
          </div>
        </div>
      }
    />
  );
}
