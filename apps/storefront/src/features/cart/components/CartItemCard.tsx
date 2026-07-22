import { Alert, Button, Card } from "antd";
import type { MenuItem } from "@warungmeng/domain";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import { getMaxSelectableQuantity } from "../../catalog/application/menuDetailModel";
import { MAX_UNTRACKED_QUANTITY } from "../../catalog/components/MenuConfigurator";
import { QuantityStepper } from "../../catalog/components/QuantityStepper";
import type { CartLineIssue, CartLineValidation } from "../application/cartValidation";
import {
  calculateCartItemLineTotal,
  type StorefrontCartItem,
} from "../application/storefrontCartModel";
import styles from "../Cart.module.css";

const ISSUE_MESSAGE_KEYS: Record<CartLineIssue, string> = {
  "menu-missing": "storefront.cart.issue.menuMissing",
  "menu-unavailable": "storefront.cart.issue.menuUnavailable",
  "variant-invalid": "storefront.cart.issue.variantInvalid",
  "price-changed": "storefront.cart.issue.priceChanged",
  "stock-shortage": "storefront.cart.issue.stockShortage",
};

interface CartItemCardProps {
  line: CartLineValidation;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onEdit: (item: StorefrontCartItem, menu: MenuItem) => void;
  onRemoveRequest: (item: StorefrontCartItem) => void;
}

export function CartItemCard({
  line,
  onQuantityChange,
  onEdit,
  onRemoveRequest,
}: CartItemCardProps) {
  const { t } = useTranslation();
  const { item, menu, issues } = line;
  const variantSummary = item.variantSelections.map((selection) => selection.optionName).join(", ");

  return (
    <Card size="small">
      <div className={styles.itemHeader}>
        <h3 className={styles.itemName}>{item.name}</h3>
        <span className={styles.itemLineTotal}>
          {formatRupiah(calculateCartItemLineTotal(item), { regionalFormat: "id-ID" })}
        </span>
      </div>
      {variantSummary ? <p className={styles.itemVariants}>{variantSummary}</p> : null}
      {item.note ? (
        <p className={styles.itemNote}>{t("storefront.cart.note.prefix", { note: item.note })}</p>
      ) : null}
      {issues.length > 0 ? (
        <div className={styles.itemIssues}>
          {issues.map((issue) => (
            <Alert key={issue} type="warning" showIcon title={t(ISSUE_MESSAGE_KEYS[issue])} />
          ))}
        </div>
      ) : null}
      <div className={styles.itemFooter}>
        {menu ? (
          <QuantityStepper
            menuName={item.name}
            quantity={item.quantity}
            maximum={getMaxSelectableQuantity(menu, MAX_UNTRACKED_QUANTITY)}
            onChange={(quantity) => onQuantityChange(item.id, quantity)}
          />
        ) : null}
        <div className={styles.itemActions}>
          {menu ? (
            <Button
              aria-label={`${t("storefront.cart.edit")} ${item.name}`}
              onClick={() => onEdit(item, menu)}
            >
              {t("storefront.cart.edit")}
            </Button>
          ) : null}
          <Button
            danger
            aria-label={`${t("storefront.cart.remove")} ${item.name}`}
            onClick={() => onRemoveRequest(item)}
          >
            {t("storefront.cart.remove")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
