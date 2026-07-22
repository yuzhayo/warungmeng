import { Button } from "antd";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styles from "../Cart.module.css";

interface CartTotalsActionProps {
  subtotal: number;
  checkoutDisabled: boolean;
}

// Phase 03 shows the real subtotal only: no discount, service charge, tax, or
// rounding until Phase 04 defines checkout pricing. The checkout button gates
// on validity here; its destination is wired in Phase 04.
export function CartTotalsAction({ subtotal, checkoutDisabled }: CartTotalsActionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className={styles.totals}>
      <div className={styles.totalsRow}>
        <span>{t("storefront.cart.subtotal")}</span>
        <span>{formatRupiah(subtotal, { regionalFormat: "id-ID" })}</span>
      </div>
      <Button
        type="primary"
        block
        size="large"
        disabled={checkoutDisabled}
        onClick={() => navigate("/checkout")}
      >
        {t("storefront.cart.checkout")}
      </Button>
    </div>
  );
}
