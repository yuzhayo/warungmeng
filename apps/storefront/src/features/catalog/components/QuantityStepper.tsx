import { Button, InputNumber } from "antd";
import { useTranslation } from "react-i18next";
import { clampQuantity } from "../application/menuDetailModel";
import styles from "../MenuDetail.module.css";

interface QuantityStepperProps {
  menuName: string;
  quantity: number;
  maximum: number;
  onChange: (quantity: number) => void;
}

export function QuantityStepper({ menuName, quantity, maximum, onChange }: QuantityStepperProps) {
  const { t } = useTranslation();

  const setQuantity = (next: number) => {
    onChange(clampQuantity(next, maximum));
  };

  return (
    <div className={styles.quantityRow}>
      <span className={styles.quantityLabel}>{t("storefront.detail.quantity.label")}</span>
      <div className={styles.quantityControls}>
        <Button
          aria-label={t("storefront.detail.quantity.decrease", { name: menuName })}
          disabled={quantity <= 1}
          onClick={() => setQuantity(quantity - 1)}
        >
          −
        </Button>
        <InputNumber
          aria-label={t("storefront.detail.quantity.input", { name: menuName })}
          className={styles.quantityInput}
          min={1}
          max={maximum}
          step={1}
          precision={0}
          controls={false}
          value={quantity}
          onChange={(value) => {
            if (typeof value === "number") setQuantity(value);
          }}
        />
        <Button
          aria-label={t("storefront.detail.quantity.increase", { name: menuName })}
          disabled={quantity >= maximum}
          onClick={() => setQuantity(quantity + 1)}
        >
          +
        </Button>
      </div>
    </div>
  );
}
