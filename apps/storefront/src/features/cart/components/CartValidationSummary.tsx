import { Alert } from "antd";
import { useTranslation } from "react-i18next";

interface CartValidationSummaryProps {
  allValid: boolean;
}

export function CartValidationSummary({ allValid }: CartValidationSummaryProps) {
  const { t } = useTranslation();

  if (allValid) return null;

  return <Alert type="warning" showIcon title={t("storefront.cart.invalid.summary")} />;
}
