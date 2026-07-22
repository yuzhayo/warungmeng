import { Button } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import styles from "../OrderConfirmation.module.css";

export function OrderConfirmationActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className={styles.actions}>
      <Button type="primary" size="large" block onClick={() => navigate("/")}>
        {t("storefront.order.actions.newOrder")}
      </Button>
    </div>
  );
}
