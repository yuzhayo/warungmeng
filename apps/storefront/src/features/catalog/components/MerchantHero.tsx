import { Card } from "antd";
import { useTranslation } from "react-i18next";
import styles from "../StorefrontCatalog.module.css";

export function MerchantHero() {
  const { t } = useTranslation();

  return (
    <Card className={styles.merchantHero} variant="outlined">
      <div className={styles.heroContent}>
        <h2>WARUNG MENG</h2>
        <p>{t("storefront.header.tagline")}</p>
      </div>
    </Card>
  );
}
