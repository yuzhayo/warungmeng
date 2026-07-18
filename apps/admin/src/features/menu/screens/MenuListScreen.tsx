import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuCategory, MenuItem } from "@warungmeng/domain";
import { Alert, App, Button } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { menuCatalogRepository } from "../application/menuCatalogRepository";
import { deleteMenuCategoryIfUnused } from "../application/menuCategoryCommands";
import { useMenuList } from "../application/useMenuList";
import { CatalogSplitTableLayout } from "../components/CatalogSplitTableLayout";
import { MenuCategoryEditorDialog } from "../components/MenuCategoryEditorDialog";
import { MenuListTable } from "../components/MenuListTable";
import { MenuListToolbar } from "../components/MenuListToolbar";
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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const editingCategory =
    menuList.categories.find((category) => category.id === editingCategoryId) ?? null;

  function handleEdit(menu: MenuItem): void {
    navigate(`/menu/${encodeURIComponent(menu.id)}/edit`);
  }

  function closeCategoryDialog(): void {
    setCategoryDialogOpen(false);
    setEditingCategoryId(null);
  }

  async function handleSaveCategory(input: Omit<MenuCategory, "id">): Promise<void> {
    setSavingCategory(true);
    try {
      if (editingCategory) {
        const updated = await repository.updateCategory(editingCategory.id, input);
        if (!updated) {
          throw new Error("Category not found");
        }
      } else {
        await repository.createCategory(input);
      }

      const feedbackKey = editingCategory
        ? "menu.categoryDialog.feedback.saved"
        : "menu.categoryDialog.feedback.created";
      closeCategoryDialog();
      menuList.retry();
      void message.success(t(feedbackKey));
    } catch {
      void message.error(t("menu.categoryDialog.feedback.failed"));
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(): Promise<void> {
    if (!editingCategory) return;

    setDeletingCategory(true);
    try {
      const result = await deleteMenuCategoryIfUnused(repository, editingCategory.id);

      if (result.status === "in-use") {
        void message.warning(t("menu.categoryDialog.feedback.inUse", { count: result.menuCount }));
        return;
      }

      if (result.status === "not-found") {
        void message.error(t("menu.categoryDialog.feedback.notFound"));
        return;
      }

      if (menuList.filters.categoryId === editingCategory.id) {
        menuList.setCategory(null);
      }
      closeCategoryDialog();
      menuList.retry();
      void message.success(t("menu.categoryDialog.feedback.deleted"));
    } catch {
      void message.error(t("menu.categoryDialog.feedback.failed"));
    } finally {
      setDeletingCategory(false);
    }
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
        onCreateCategory={() => {
          setEditingCategoryId(null);
          setCategoryDialogOpen(true);
        }}
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
        editCategoryLabel={(category) => t("menu.actions.edit", { name: category.name })}
        expandLabel={t("menu.categories.expand")}
        onCategoryChange={menuList.setCategory}
        onCollapsedChange={setCategoryCollapsed}
        onEditCategory={(category) => {
          setEditingCategoryId(category.id);
          setCategoryDialogOpen(true);
        }}
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

      <MenuCategoryEditorDialog
        category={editingCategory}
        deleting={deletingCategory}
        nextSortOrder={
          menuList.categories.reduce(
            (highest, category) => Math.max(highest, category.sortOrder),
            -1,
          ) + 1
        }
        onCancel={closeCategoryDialog}
        onDelete={handleDeleteCategory}
        onSubmit={handleSaveCategory}
        open={categoryDialogOpen}
        submitting={savingCategory}
      />
    </>
  );
}
