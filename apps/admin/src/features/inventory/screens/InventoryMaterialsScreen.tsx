import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import type { InventoryRepository } from "@warungmeng/data";
import type { InventoryIngredient, InventoryIngredientStatus } from "@warungmeng/domain";
import { App as AntdApp, Alert, Button, Checkbox, Input, Select } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { inventoryRepository } from "../application/inventoryRepository";
import { useInventoryMaterials } from "../application/useInventoryMaterials";
import { InventoryMaterialEditorDialog } from "../components/InventoryMaterialEditorDialog";
import { InventoryMaterialsTable } from "../components/InventoryMaterialsTable";

interface InventoryMaterialsScreenProps {
  readonly repository?: InventoryRepository;
}

export function InventoryMaterialsScreen({
  repository = inventoryRepository,
}: InventoryMaterialsScreenProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const materials = useInventoryMaterials(repository);
  const [editing, setEditing] = useState<InventoryIngredient | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function openEditor(ingredient: InventoryIngredient | null): void {
    setEditing(ingredient);
    setDialogOpen(true);
  }

  return (
    <div className="inventory-view">
      <div className="inventory-toolbar">
        <Input
          allowClear
          aria-label={t("inventory.materials.search")}
          className="inventory-toolbar__search"
          onChange={(event) => materials.updateFilters({ search: event.target.value })}
          placeholder={t("inventory.materials.search")}
          prefix={<SearchOutlined />}
          value={materials.filters.search}
        />
        <Select
          allowClear
          aria-label={t("inventory.materials.statusFilter")}
          className="inventory-toolbar__select"
          onChange={(status: InventoryIngredientStatus | undefined) =>
            materials.updateFilters({ status: status ?? null })
          }
          options={(["active", "archived"] as const).map((status) => ({
            value: status,
            label: t(`inventory.materials.${status}`),
          }))}
          placeholder={t("inventory.materials.statusFilter")}
          value={materials.filters.status ?? undefined}
        />
        <Checkbox
          checked={materials.filters.lowStockOnly}
          onChange={(event) => materials.updateFilters({ lowStockOnly: event.target.checked })}
        >
          {t("inventory.materials.lowStockOnly")}
        </Checkbox>
        <Button onClick={materials.resetFilters}>{t("inventory.actions.reset")}</Button>
        <Button
          className="inventory-toolbar__action"
          icon={<PlusOutlined />}
          onClick={() => openEditor(null)}
          type="primary"
        >
          {t("inventory.materials.create")}
        </Button>
      </div>

      {materials.error ? (
        <Alert
          action={<Button onClick={materials.retry}>{t("inventory.actions.retry")}</Button>}
          showIcon
          title={t("inventory.materials.loadError")}
          type="error"
        />
      ) : null}

      <div className="inventory-table">
        <InventoryMaterialsTable
          balanceByIngredientId={materials.balanceByIngredientId}
          ingredients={materials.ingredients}
          loading={materials.loading}
          onArchive={async (ingredient) => {
            await materials.archiveIngredient(ingredient.id);
            void message.success(t("inventory.materials.archivedFeedback"));
          }}
          onEdit={openEditor}
          suppliers={materials.suppliers}
        />
      </div>

      <InventoryMaterialEditorDialog
        ingredient={editing}
        onCancel={() => setDialogOpen(false)}
        onSubmit={async (input) => {
          setSubmitting(true);
          try {
            await materials.saveIngredient(editing?.id ?? null, input);
            setDialogOpen(false);
            void message.success(t("inventory.materials.saved"));
          } catch {
            void message.error(t("inventory.materials.saveError"));
          } finally {
            setSubmitting(false);
          }
        }}
        open={dialogOpen}
        submitting={submitting}
        suppliers={materials.suppliers}
      />
    </div>
  );
}
