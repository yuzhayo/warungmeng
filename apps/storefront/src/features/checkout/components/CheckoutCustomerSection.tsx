import { Card, Form, Input } from "antd";
import { useTranslation } from "react-i18next";
import { MAX_CUSTOMER_NAME_LENGTH } from "../application/checkoutModel";

export function CheckoutCustomerSection() {
  const { t } = useTranslation();

  return (
    <Card title={t("storefront.checkout.customer.title")} size="small">
      <Form.Item
        name="customerName"
        label={t("storefront.checkout.customer.name")}
        rules={[
          {
            required: true,
            whitespace: true,
            message: t("storefront.checkout.error.nameRequired"),
          },
          { max: MAX_CUSTOMER_NAME_LENGTH, message: t("storefront.checkout.error.nameTooLong") },
        ]}
      >
        <Input
          autoComplete="name"
          maxLength={MAX_CUSTOMER_NAME_LENGTH}
          placeholder={t("storefront.checkout.customer.namePlaceholder")}
        />
      </Form.Item>
      <Form.Item
        name="customerPhone"
        label={t("storefront.checkout.customer.phone")}
        rules={[{ required: true, message: t("storefront.checkout.error.phoneInvalid") }]}
      >
        <Input
          autoComplete="tel"
          inputMode="tel"
          placeholder={t("storefront.checkout.customer.phonePlaceholder")}
        />
      </Form.Item>
    </Card>
  );
}
