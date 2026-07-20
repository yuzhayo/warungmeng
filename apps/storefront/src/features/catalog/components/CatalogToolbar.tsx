import { Input } from "antd";
import type { MenuCategory } from "@warungmeng/domain";
import { useTranslation } from "react-i18next";
import { CategoryNavigation } from "./CategoryNavigation";
import styles from "../StorefrontCatalog.module.css";

interface CatalogToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: readonly MenuCategory[];
}

export function CatalogToolbar({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories,
}: CatalogToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.catalogToolbar}>
      <Input.Search
        aria-label={t("storefront.search.label")}
        placeholder={t("storefront.search.placeholder")}
        allowClear
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onSearch={onSearchChange}
        className={styles.catalogSearch}
      />
      <CategoryNavigation
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        categories={categories}
      />
    </div>
  );
}
