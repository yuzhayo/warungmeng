import { useLocaleSettings, type SupportedLanguage } from "@warungmeng/i18n";
import { Segmented } from "antd";
import { useTranslation } from "react-i18next";
import styles from "./StorefrontShell.module.css";

export function StorefrontHeader() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLocaleSettings();

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <div className={styles.merchantInfo}>
          <h1 className={styles.merchantName}>WARUNG MENG</h1>
          <p className={styles.tagline}>{t("storefront.header.tagline")}</p>
        </div>
        <div className={styles.controls}>
          <Segmented<SupportedLanguage>
            aria-label={t("storefront.header.languageLabel")}
            size="small"
            value={language}
            onChange={setLanguage}
            options={[
              { label: t("language.id"), value: "id" },
              { label: t("language.en"), value: "en" },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
