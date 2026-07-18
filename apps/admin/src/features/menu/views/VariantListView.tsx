import type { MenuCatalogRepository } from "@warungmeng/data";
import { Alert, Button } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { menuCatalogRepository } from "../application/menuCatalogRepository";
import { useVariantGroupList } from "../application/useVariantGroupList";
import { CatalogSplitTableLayout } from "../components/CatalogSplitTableLayout";
import { VariantGroupListToolbar } from "../components/VariantGroupListToolbar";
import { VariantOptionListTable } from "../components/VariantOptionListTable";

export interface VariantListViewProps {
  readonly repository?: MenuCatalogRepository;
}

export function VariantListView({ repository = menuCatalogRepository }: VariantListViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const variantList = useVariantGroupList(repository);
  const [categoryCollapsed, setCategoryCollapsed] = useState(false);

  const errorMessage =
    variantList.error === "load"
      ? t("variants.error.load")
      : variantList.error === "update"
        ? t("variants.error.update")
        : null;

  return (
    <>
      <VariantGroupListToolbar
        allCount={variantList.allCount}
        availability={variantList.filters.availability}
        onAvailabilityChange={variantList.setAvailability}
        onCreate={() => navigate("/menu/variants/new")}
        onSearchChange={variantList.setSearch}
        search={variantList.filters.search}
        unavailableCount={variantList.unavailableCount}
      />

      {errorMessage ? (
        <Alert
          action={
            variantList.error === "load" ? (
              <Button onClick={variantList.retry} size="small">
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
        categories={variantList.groups.map((group) => ({
          count: variantList.groupCounts.get(group.id) ?? 0,
          id: group.id,
          name: group.name,
        }))}
        categoryAriaLabel={t("variants.categories.title")}
        categoryTitle={t("variants.categories.title")}
        collapsed={categoryCollapsed}
        collapseLabel={t("variants.categories.collapse")}
        editCategoryLabel={(category) => t("variants.actions.edit", { name: category.name })}
        expandLabel={t("variants.categories.expand")}
        onCategoryChange={variantList.setGroup}
        onCollapsedChange={setCategoryCollapsed}
        onEditCategory={(category) => {
          const group = variantList.groups.find((item) => item.id === category.id);
          if (group) navigate(`/menu/variants/${encodeURIComponent(group.id)}/edit`);
        }}
        selectedCategoryId={variantList.filters.groupId}
      >
        <VariantOptionListTable
          items={variantList.filteredOptions}
          loading={variantList.loading}
          onAvailabilityChange={variantList.setVariantOptionAvailability}
          onDelete={variantList.deleteVariantOption}
          onSave={variantList.saveVariantOption}
          pendingOptionIds={variantList.pendingOptionIds}
        />
      </CatalogSplitTableLayout>
    </>
  );
}
