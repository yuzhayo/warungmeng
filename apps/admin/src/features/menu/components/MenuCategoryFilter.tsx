import {
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import type { MenuCategory } from "@warungmeng/domain";
import { Button, Menu, Tooltip, Typography } from "antd";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";

export interface MenuCategoryFilterProps {
  readonly categories: readonly MenuCategory[];
  readonly counts: ReadonlyMap<string, number>;
  readonly selectedCategoryId: string | null;
  readonly totalCount: number;
  readonly collapsed: boolean;
  readonly onChange: (categoryId: string | null) => void;
  readonly onCollapsedChange: (collapsed: boolean) => void;
}

export function MenuCategoryFilter({
  categories,
  collapsed,
  counts,
  selectedCategoryId,
  totalCount,
  onChange,
  onCollapsedChange,
}: MenuCategoryFilterProps) {
  const { t } = useTranslation();
  const collapseLabel = t(collapsed ? "menu.categories.expand" : "menu.categories.collapse");
  const items: MenuProps["items"] = [
    {
      icon: <AppstoreOutlined />,
      key: "all",
      label: `${t("menu.categories.all")} (${totalCount})`,
      title: `${t("menu.categories.all")} (${totalCount})`,
    },
    ...categories.map((category) => ({
      icon: <TagsOutlined />,
      key: category.id,
      label: `${category.name} (${counts.get(category.id) ?? 0})`,
      title: `${category.name} (${counts.get(category.id) ?? 0})`,
    })),
  ];

  return (
    <aside
      aria-label={t("menu.categories.title")}
      className={`menu-category-filter${collapsed ? " menu-category-filter--collapsed" : ""}`}
      data-testid="menu-category-filter"
    >
      <div className="menu-category-filter__header">
        <Tooltip title={collapseLabel}>
          <Button
            aria-expanded={!collapsed}
            aria-label={collapseLabel}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => onCollapsedChange(!collapsed)}
            type="text"
          />
        </Tooltip>
        <Typography.Title className="menu-category-filter__title" level={5}>
          {t("menu.categories.title")}
        </Typography.Title>
      </div>
      <Menu
        inlineCollapsed={collapsed}
        items={items}
        mode="inline"
        onClick={({ key }) => onChange(key === "all" ? null : key)}
        selectedKeys={[selectedCategoryId ?? "all"]}
      />
    </aside>
  );
}
