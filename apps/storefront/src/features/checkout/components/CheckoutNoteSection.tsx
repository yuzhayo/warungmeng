import { Card, Form, Input } from "antd";
import { useTranslation } from "react-i18next";
import { MAX_CUSTOMER_NOTE_LENGTH } from "../application/checkoutModel";

export function CheckoutNoteSection() {
  const { t } = useTranslation();
  return (
    <Card title={t("storefront.checkout.note.title")} size="small">
      <Form.Item
        name="customerNote"
        label={t("storefront.checkout.note.label")}
        rules={[
          { max: MAX_CUSTOMER_NOTE_LENGTH, message: t("storefront.checkout.error.noteTooLong") },
        ]}
      >
        <Input.TextArea
          autoComplete="off"
          maxLength={MAX_CUSTOMER_NOTE_LENGTH}
          showCount
          rows={3}
          placeholder={t("storefront.checkout.note.placeholder")}
        />
      </Form.Item>
    </Card>
  );
}
