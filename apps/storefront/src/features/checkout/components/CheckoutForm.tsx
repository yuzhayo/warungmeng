import { Alert, Form } from "antd";
import { useTranslation } from "react-i18next";
import type { StorefrontCartItem } from "../../cart/application/storefrontCartModel";
import {
  createDefaultCheckoutDraft,
  normalizeCheckoutDraft,
  validateCheckoutDraft,
  type StorefrontCheckoutDraft,
  type StorefrontCheckoutField,
} from "../application/checkoutModel";
import { CheckoutCustomerSection } from "./CheckoutCustomerSection";
import { CheckoutFulfillmentSection } from "./CheckoutFulfillmentSection";
import { CheckoutItemsSection } from "./CheckoutItemsSection";
import { CheckoutNoteSection } from "./CheckoutNoteSection";
import { CheckoutPaymentSection } from "./CheckoutPaymentSection";
import { CheckoutStickyAction } from "./CheckoutStickyAction";
import styles from "../Checkout.module.css";

interface CheckoutFormProps {
  readonly items: readonly StorefrontCartItem[];
  readonly total: number;
  readonly submitting: boolean;
  readonly submitFailed: boolean;
  readonly onSubmit: (draft: StorefrontCheckoutDraft) => void;
}

const ERROR_KEYS: Record<StorefrontCheckoutField, Record<string, string>> = {
  customerName: {
    required: "storefront.checkout.error.nameRequired",
    "too-long": "storefront.checkout.error.nameTooLong",
  },
  customerPhone: { invalid: "storefront.checkout.error.phoneInvalid" },
  customerNote: { "too-long": "storefront.checkout.error.noteTooLong" },
};

export function CheckoutForm({
  items,
  total,
  submitting,
  submitFailed,
  onSubmit,
}: CheckoutFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<StorefrontCheckoutDraft>();

  const handleFinish = (draft: StorefrontCheckoutDraft) => {
    const errors = validateCheckoutDraft(draft);
    const fields = (Object.keys(errors) as StorefrontCheckoutField[]).map((name) => {
      const code = errors[name] ?? "invalid";
      return {
        name: [name] as [StorefrontCheckoutField],
        errors: [t(ERROR_KEYS[name][code] ?? "storefront.checkout.error.invalid")],
      };
    });
    if (fields.length > 0) {
      form.setFields(fields);
      const first = fields[0];
      if (first) form.scrollToField(first.name, { focus: true });
      return;
    }
    onSubmit(normalizeCheckoutDraft(draft));
  };

  return (
    <Form<StorefrontCheckoutDraft>
      form={form}
      layout="vertical"
      initialValues={createDefaultCheckoutDraft()}
      onFinish={handleFinish}
      scrollToFirstError={{ focus: true }}
      disabled={submitting}
    >
      {submitFailed ? (
        <Alert
          className={styles.submitAlert}
          type="error"
          showIcon
          title={t("storefront.checkout.error.submit")}
          role="alert"
        />
      ) : null}
      <div className={styles.checkoutGrid}>
        <div className={styles.formColumn}>
          <CheckoutCustomerSection />
          <CheckoutFulfillmentSection />
          <CheckoutNoteSection />
          <CheckoutPaymentSection />
        </div>
        <div className={styles.reviewColumn}>
          <CheckoutItemsSection items={items} />
        </div>
      </div>
      <CheckoutStickyAction total={total} submitting={submitting} />
    </Form>
  );
}
