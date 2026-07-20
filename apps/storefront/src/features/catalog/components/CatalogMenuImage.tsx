import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MenuItem } from "@warungmeng/domain";
import styles from "../StorefrontCatalog.module.css";

interface CatalogMenuImageProps {
  image: MenuItem["image"];
  className?: string;
}

export function CatalogMenuImage({ image, className }: CatalogMenuImageProps) {
  const { t } = useTranslation();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const hasImage = Boolean(image?.url) && failedUrl !== image?.url;
  const placeholderClassName = [className, styles.imagePlaceholder].filter(Boolean).join(" ");

  if (!hasImage || !image) {
    return (
      <div
        className={placeholderClassName}
        role="img"
        aria-label={t("storefront.image.unavailable")}
      >
        <span>{t("storefront.image.unavailable")}</span>
      </div>
    );
  }

  return (
    <img
      alt={image.alt}
      src={image.url}
      className={className}
      onError={() => setFailedUrl(image.url)}
    />
  );
}
