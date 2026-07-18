import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuItem } from "@warungmeng/domain";
import { Alert, App, Button } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TabbedScreenLayout } from "../../../components/layout/TabbedScreenLayout";
import { menuCatalogRepository } from "../application/menuCatalogRepository";
import { useMenuList } from "../application/useMenuList";
import { MenuCategoryFilter } from "../components/MenuCategoryFilter";
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
    <TabbedScreenLayout
      activeTabKey="list"
      className="menu-list-screen"
      description={t("screen.menu.description")}
      tabAriaLabel={t("menu.tabs.label")}
      tabs={[
        { key: "list", label: t("menu.tabs.list") },
        { disabled: true, key: "variants", label: t("menu.tabs.variants") },
      ]}
      title={t("screen.menu.title")}
      titleId="menu-list-title"
    >
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

      <div
        className={`menu-list-screen__catalog${
          categoryCollapsed ? " menu-list-screen__catalog--category-collapsed" : ""
        }`}
      >
        <MenuCategoryFilter
          categories={menuList.categories}
          collapsed={categoryCollapsed}
          counts={menuList.categoryCounts}
          onChange={menuList.setCategory}
          onCollapsedChange={setCategoryCollapsed}
          selectedCategoryId={menuList.filters.categoryId}
          totalCount={menuList.allCount}
        />
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
      </div>
    </TabbedScreenLayout>
  );
}
