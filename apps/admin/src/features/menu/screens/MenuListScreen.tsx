import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuItem } from "@warungmeng/domain";
import { Alert, App, Button } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { menuCatalogRepository } from "../application/menuCatalogRepository";
import { useMenuList } from "../application/useMenuList";
import { CatalogSplitTableLayout } from "../components/CatalogSplitTableLayout";
import { MenuListTable } from "../components/MenuListTable";
import { MenuListToolbar } from "../components/MenuListToolbar";
import "./MenuListScreen.css";

export interface MenuListScreenProps {
  readonly repository?: MenuCatalogRepository;
}

export function MenuListScreen({ repository = menuCatalogRepository }: MenuListScreenProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const menuList = useMenuList(repository);
  const [categoryCollapsed, setCategoryCollapsed] = useState(false);

  function showComingSoon(feature: string): void {
    void message.info(t("menu.feedback.comingSoon", { feature }));
  }

  function handleEdit(menu: MenuItem): void {
    showComingSoon(t("menu.actions.edit", { name: menu.name }));
  }

  const errorMessage =
    menuList.error === "load"
      ? t("menu.error.load")
      : menuList.error === "update"
        ? t("menu.error.update")
        : null;

  return (
    <>
      <MenuListToolbar
        allCount={menuList.allCount}
        availability={menuList.filters.availability}
        onAvailabilityChange={menuList.setAvailability}
        onCreateCategory={() => showComingSoon(t("menu.actions.createCategory"))}
        onCreateMenu={() => showComingSoon(t("menu.actions.createMenu"))}
        onSearchChange={menuList.setSearch}
        search={menuList.filters.search}
        unavailableCount={menuList.unavailableCount}
      />

      {errorMessage ? (
        <Alert
          action={
            menuList.error === "load" ? (
              <Button onClick={menuList.retry} size="small">
                {t("menu.actions.retry")}
              </Button>
            ) : null
          }
          closable
          showIcon
          title={errorMessage}
          type="error"
        />
      ) : null}

      <CatalogSplitTableLayout
        categories={menuList.categories.map((category) => ({
          count: menuList.categoryCounts.get(category.id) ?? 0,
          id: category.id,
          name: category.name,
        }))}
        categoryAriaLabel={t("menu.categories.title")}
        categoryTitle={t("menu.categories.title")}
        collapsed={categoryCollapsed}
        collapseLabel={t("menu.categories.collapse")}
        expandLabel={t("menu.categories.expand")}
        onCategoryChange={menuList.setCategory}
        onCollapsedChange={setCategoryCollapsed}
        selectedCategoryId={menuList.filters.categoryId}
      >
        <div className="menu-list-screen__table">
          <MenuListTable
            loading={menuList.loading}
            menus={menuList.filteredMenus}
            onAvailabilityChange={(menuId, available) => {
              void menuList.setMenuAvailability(menuId, available);
            }}
            onEdit={handleEdit}
            onVisibilityChange={(menuId, visible) => {
              void menuList.setMenuVisibility(menuId, visible);
            }}
            pendingMenuIds={menuList.pendingMenuIds}
          />
        </div>
      </CatalogSplitTableLayout>
    </>
  );
}
