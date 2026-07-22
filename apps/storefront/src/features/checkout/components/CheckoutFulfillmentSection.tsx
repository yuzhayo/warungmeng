import { Card, Typography } from "antd";
import { useTranslation } from "react-i18next";

export function CheckoutFulfillmentSection() {
  const { t } = useTranslation();
  return (
    <Card title={t("storefront.checkout.fulfillment.title")} size="small">
      <Typography.Text strong>{t("storefront.checkout.fulfillment.pickup")}</Typography.Text>
      <br />
      <Typography.Text type="secondary">WARUNG MENG</Typography.Text>
    </Card>
  );
}
