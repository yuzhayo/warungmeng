import { PlusOutlined } from "@ant-design/icons";
import type { InventoryRepository } from "@warungmeng/data";
import type { InventoryMovementType } from "@warungmeng/domain";
import type { TranslationKey } from "@warungmeng/i18n";
import { App as AntdApp, Alert, Button, Select } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { INVENTORY_MOVEMENT_TYPES, INVENTORY_OUTLETS } from "../application/inventoryConstants";
import { inventoryRepository } from "../application/inventoryRepository";
import { useInventoryMovements } from "../application/useInventoryMovements";
import { InventoryMovementDialog } from "../components/InventoryMovementDialog";
import { InventoryMovementsTable } from "../components/InventoryMovementsTable";

interface InventoryMovementsScreenProps {
  readonly repository?: InventoryRepository;
}

export function InventoryMovementsScreen({
  repository = inventoryRepository,
}: InventoryMovementsScreenProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const inventory = useInventoryMovements(repository);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="inventory-view">
      <div className="inventory-toolbar">
        <Select
          aria-label={t("inventory.outlet")}
          className="inventory-toolbar__select"
          onChange={(outletId: string) => inventory.updateFilters({ outletId })}
          options={INVENTORY_OUTLETS.map((outlet) => ({
            value: outlet.id,
            label: t(outlet.nameKey),
          }))}
          value={inventory.filters.outletId}
        />
        <Select
          allowClear
          aria-label={t("inventory.movements.ingredient")}
          className="inventory-toolbar__select"
          onChange={(ingredientId: string | undefined) =>
            inventory.updateFilters({ ingredientId: ingredientId ?? null })
          }
          options={inventory.ingredients.map((ingredient) => ({
            value: ingredient.id,
            label: ingredient.name,
          }))}
          placeholder={t("inventory.movements.ingredient")}
          showSearch={{ optionFilterProp: "label" }}
          value={inventory.filters.ingredientId ?? undefined}
        />
        <Select
          allowClear
          aria-label={t("inventory.movements.type")}
          className="inventory-toolbar__select"
          onChange={(type: InventoryMovementType | undefined) =>
            inventory.updateFilters({ type: type ?? null })
          }
          options={INVENTORY_MOVEMENT_TYPES.map((type) => ({
            value: type,
            label: t(`inventory.movements.${type}` as TranslationKey),
          }))}
          placeholder={t("inventory.movements.type")}
          value={inventory.filters.type ?? undefined}
        />
        <Button onClick={inventory.resetFilters}>{t("inventory.actions.reset")}</Button>
        <Button
          className="inventory-toolbar__action"
          icon={<PlusOutlined />}
          onClick={() => setDialogOpen(true)}
          type="primary"
        >
          {t("inventory.movements.record")}
        </Button>
      </div>

      {inventory.error ? (
        <Alert
          action={<Button onClick={inventory.retry}>{t("inventory.actions.retry")}</Button>}
          showIcon
          title={t("inventory.movements.loadError")}
          type="error"
        />
      ) : null}

      <div className="inventory-table">
        <InventoryMovementsTable
          ingredients={inventory.ingredients}
          loading={inventory.loading}
          movements={inventory.movements}
        />
      </div>

      <InventoryMovementDialog
        ingredients={inventory.ingredients}
        onCancel={() => setDialogOpen(false)}
        onSubmit={async (input) => {
          setSubmitting(true);
          try {
            await inventory.recordMovement(input);
            setDialogOpen(false);
            void message.success(t("inventory.movements.saved"));
          } catch {
            void message.error(t("inventory.movements.saveError"));
          } finally {
            setSubmitting(false);
          }
        }}
        open={dialogOpen}
        submitting={submitting}
      />
    </div>
  );
}
