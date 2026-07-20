import { Tabs } from "antd";
import type { MenuCategory } from "@warungmeng/domain";
import { useTranslation } from "react-i18next";

interface CategoryNavigationProps {
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  categories: readonly MenuCategory[];
}

export function CategoryNavigation({
  activeCategory,
  onCategoryChange,
  categories,
}: CategoryNavigationProps) {
  const { t } = useTranslation();
  const items = [
    { key: "featured", label: t("storefront.featured.tab") },
    ...categories.map((category) => ({ key: category.id, label: category.name })),
  ];

  return (
    <Tabs
      activeKey={activeCategory}
      items={items}
      onChange={onCategoryChange}
      tabBarGutter={16}
      tabPlacement="top"
      animated={false}
    />
  );
}
