import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { formatRupiah } from "@warungmeng/i18n";
import { calculateCartSubtotal, countCartItems } from "../application/storefrontCartModel";
import { useStorefrontCart } from "../application/storefrontCartContext";
import styles from "../Cart.module.css";

// The bar belongs to browsing flows only; the cart screen shows its own
// totals, so rendering the bar there would duplicate them.
function isBrowsingRoute(pathname: string): boolean {
  return pathname === "/" || pathname.startsWith("/menu/");
}

export function CartSummaryBar() {
  const { t } = useTranslation();
  const { items } = useStorefrontCart();
  const location = useLocation();
  const navigate = useNavigate();

  if (items.length === 0 || !isBrowsingRoute(location.pathname)) {
    return null;
  }

  const subtotal = formatRupiah(calculateCartSubtotal(items), { regionalFormat: "id-ID" });

  return (
    <div className={styles.bar}>
      <div className={styles.barInner}>
        <span className={styles.barSummary}>
          {t("storefront.cart.bar.summary", { count: countCartItems(items), subtotal })}
        </span>
        <Button type="primary" onClick={() => navigate("/cart")}>
          {t("storefront.cart.bar.action")}
        </Button>
      </div>
    </div>
  );
}
