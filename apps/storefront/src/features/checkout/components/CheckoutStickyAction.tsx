import { Button } from "antd";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import styles from "../Checkout.module.css";

interface CheckoutStickyActionProps {
  readonly total: number;
  readonly submitting: boolean;
}

export function CheckoutStickyAction({ total, submitting }: CheckoutStickyActionProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.stickyAction}>
      <div>
        <span className={styles.totalLabel}>{t("storefront.checkout.total")}</span>
        <strong>{formatRupiah(total, { regionalFormat: "id-ID" })}</strong>
      </div>
      <Button type="primary" htmlType="submit" size="large" loading={submitting}>
        {t("storefront.checkout.submit")}
      </Button>
    </div>
  );
}
