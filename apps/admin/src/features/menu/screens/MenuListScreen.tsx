import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuItem } from "@warungmeng/domain";
import { Alert, App, Button } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { menuCatalogRepository } from "../application/menuCatalogRepository";
import { useMenuList } from "../application/useMenuList";
import { CatalogSplitTableLayout } from "../components/CatalogSplitTableLayout";
import { MenuListTable } from "../components/MenuListTable";
import { MenuListToolbar } from "../components/MenuListToolbar";
import { MenuCategoryCreateDialog } from "../components/MenuCategoryCreateDialog";
import "./MenuListScreen.css";

export interface MenuListScreenProps {
  readonly repository?: MenuCatalogRepository;
}

export function MenuListScreen({ repository = menuCatalogRepository }: MenuListScreenProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const menuList = useMenuList(repository);
  const [categoryCollapsed, setCategoryCollapsed] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);

  function handleEdit(menu: MenuItem): void {
    navigate(`/menu/${encodeURIComponent(menu.id)}/edit`);
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
        onCreateCategory={() => setCategoryDialogOpen(true)}
        onCreateMenu={() => navigate("/menu/new")}
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

      <MenuCategoryCreateDialog
        nextSortOrder={
          menuList.categories.reduce(
            (highest, category) => Math.max(highest, category.sortOrder),
            -1,
          ) + 1
        }
        onCancel={() => setCategoryDialogOpen(false)}
        onSubmit={async (input) => {
          setCreatingCategory(true);
          try {
            await repository.createCategory(input);
            setCategoryDialogOpen(false);
            menuList.retry();
            void message.success(t("menu.categoryDialog.feedback.created"));
          } catch {
            void message.error(t("menu.categoryDialog.feedback.failed"));
          } finally {
            setCreatingCategory(false);
          }
        }}
        open={categoryDialogOpen}
        submitting={creatingCategory}
      />
    </>
  );
}
