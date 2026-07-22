import { useLocaleSettings } from "@warungmeng/i18n";
import { Button } from "antd";
import { useTranslation } from "react-i18next";
import styles from "./StorefrontShell.module.css";

export function StorefrontHeader() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLocaleSettings();

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.merchantInfo}>
          <h1 className={styles.merchantName}>{t("storefront.merchant.name")}</h1>
          <p className={styles.tagline}>{t("storefront.header.tagline")}</p>
        </div>
        <div className={styles.controls}>
          <Button
            aria-label={t("storefront.header.languageLabel")}
            size="small"
            className={styles.languageButton}
            title={language === "id" ? t("language.en") : t("language.id")}
            onClick={() => setLanguage(language === "id" ? "en" : "id")}
          >
            {language.toUpperCase()}
          </Button>
        </div>
      </div>
    </header>
  );
}
