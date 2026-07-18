import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuVariantGroup } from "@warungmeng/domain";
import { Alert, App, Button } from "antd";
import { useTranslation } from "react-i18next";
import { menuCatalogRepository } from "../application/menuCatalogRepository";
import { useVariantGroupList } from "../application/useVariantGroupList";
import { VariantGroupListTable } from "../components/VariantGroupListTable";
import { VariantGroupListToolbar } from "../components/VariantGroupListToolbar";

export interface MenuVariantListScreenProps {
  readonly repository?: MenuCatalogRepository;
}

export function MenuVariantListScreen({
  repository = menuCatalogRepository,
}: MenuVariantListScreenProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const variantList = useVariantGroupList(repository);

  function showComingSoon(feature: string): void {
    void message.info(t("menu.feedback.comingSoon", { feature }));
  }

  function handleEdit(group: MenuVariantGroup): void {
    showComingSoon(t("variants.actions.edit", { name: group.name }));
  }

  function handleDelete(group: MenuVariantGroup): void {
    showComingSoon(t("variants.actions.delete", { name: group.name }));
  }

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
        onCreate={() => showComingSoon(t("variants.actions.create"))}
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

      <div style={{ minWidth: 0, overflow: "hidden" }}>
        <VariantGroupListTable
          connectedMenuCounts={variantList.connectedMenuCounts}
          groups={variantList.filteredGroups}
          loading={variantList.loading}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onVisibilityChange={(groupId, visible) => {
            void variantList.setGroupVisibility(groupId, visible);
          }}
          pendingGroupIds={variantList.pendingGroupIds}
        />
      </div>
    </>
  );
}
