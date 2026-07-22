import { Card, Typography } from "antd";
import { useTranslation } from "react-i18next";

export function CheckoutPaymentSection() {
  const { t } = useTranslation();
  return (
    <Card title={t("storefront.checkout.payment.title")} size="small">
      <Typography.Text strong>{t("storefront.checkout.payment.cash")}</Typography.Text>
      <br />
      <Typography.Text type="secondary">
        {t("storefront.checkout.payment.cashDescription")}
      </Typography.Text>
    </Card>
  );
}
