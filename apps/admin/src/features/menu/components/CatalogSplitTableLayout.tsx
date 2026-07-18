import {
  AppstoreOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { getReadableTextColor } from "@warungmeng/ui-admin";
import { Button, Menu, Tooltip, Typography, theme } from "antd";
import type { MenuProps } from "antd";
import type { CSSProperties, ReactNode } from "react";
import "./CatalogSplitTableLayout.css";

export interface CatalogCategoryItem {
  readonly id: string;
  readonly name: string;
  readonly count: number;
}

export interface CatalogSplitTableLayoutProps {
  readonly categories: readonly CatalogCategoryItem[];
  readonly categoryAriaLabel: string;
  readonly categoryTitle: string;
  readonly children: ReactNode;
  readonly collapsed: boolean;
  readonly collapseLabel: string;
  readonly expandLabel: string;
  readonly selectedCategoryId: string | null;
  readonly editCategoryLabel?: (category: CatalogCategoryItem) => string;
  readonly onCategoryChange: (categoryId: string | null) => void;
  readonly onCollapsedChange: (collapsed: boolean) => void;
  readonly onEditCategory?: (category: CatalogCategoryItem) => void;
}

type CatalogLayoutStyle = CSSProperties & {
  readonly "--wm-catalog-category-width": string;
  readonly "--wm-catalog-header-background": string;
  readonly "--wm-catalog-header-text": string;
};

function getCategoryWidth(categories: readonly CatalogCategoryItem[], title: string): string {
  const longestLabelLength = categories.reduce(
    (longest, category) => Math.max(longest, `${category.name} (${category.count})`.length),
    title.length,
  );
  const preferredWidth = Math.min(24, Math.max(14, 5 + longestLabelLength * 0.58));
  return `${preferredWidth}rem`;
}

export function CatalogSplitTableLayout({
  categories,
  categoryAriaLabel,
  categoryTitle,
  children,
  collapsed,
  collapseLabel,
  expandLabel,
  selectedCategoryId,
  editCategoryLabel,
  onCategoryChange,
  onCollapsedChange,
  onEditCategory,
}: CatalogSplitTableLayoutProps) {
  const { token } = theme.useToken();
  const toggleLabel = collapsed ? expandLabel : collapseLabel;
  const style: CatalogLayoutStyle = {
    "--wm-catalog-category-width": getCategoryWidth(categories, categoryTitle),
    "--wm-catalog-header-background": token.colorPrimary,
    "--wm-catalog-header-text": getReadableTextColor(token.colorPrimary),
  };

  const items: MenuProps["items"] = categories.map((category) => ({
    icon: onEditCategory ? (
      <Tooltip title={editCategoryLabel?.(category)}>
        <Button
          aria-label={editCategoryLabel?.(category)}
          icon={<EditOutlined />}
          onClick={(event) => {
            event.stopPropagation();
            onEditCategory(category);
          }}
          size="small"
          type="text"
        />
      </Tooltip>
    ) : (
      <TagsOutlined />
    ),
    key: category.id,
    label: (
      <span className="catalog-category-rail__label">
        <span className="catalog-category-rail__name">{category.name}</span>
        <span>({category.count})</span>
      </span>
    ),
    title: `${category.name} (${category.count})`,
  }));

  return (
    <div
      className={`catalog-split-table${collapsed ? " catalog-split-table--collapsed" : ""}`}
      style={style}
    >
      <aside
        aria-label={categoryAriaLabel}
        className={`catalog-category-rail${collapsed ? " catalog-category-rail--collapsed" : ""}`}
        data-testid="catalog-category-rail"
      >
        <div className="catalog-category-rail__header">
          <Tooltip title={toggleLabel}>
            <Button
              aria-expanded={!collapsed}
              aria-label={toggleLabel}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => onCollapsedChange(!collapsed)}
              type="text"
            />
          </Tooltip>
          <button
            aria-label={categoryTitle}
            aria-pressed={selectedCategoryId === null}
            className="catalog-category-rail__all"
            onClick={() => onCategoryChange(null)}
            type="button"
          >
            <AppstoreOutlined />
            <Typography.Text strong>{categoryTitle}</Typography.Text>
          </button>
        </div>
        <Menu
          inlineCollapsed={collapsed}
          items={items}
          mode="inline"
          onClick={({ key }) => onCategoryChange(key)}
          selectedKeys={selectedCategoryId ? [selectedCategoryId] : []}
          tooltip={{ placement: "right" }}
        />
      </aside>

      <div className="catalog-split-table__content">{children}</div>
    </div>
  );
}
