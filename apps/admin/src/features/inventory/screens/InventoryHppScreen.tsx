import { App as AntdApp, Alert, Button } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  InventoryAdjustCapability,
  InventoryReadCapability,
} from "../application/inventoryCapabilities";
import type { InventoryCatalogReadPort } from "../application/ports/catalogReadPort";
import { useInventoryHpp, type InventoryHppRow } from "../application/useInventoryHpp";
import { InventoryHppTable } from "../components/InventoryHppTable";
import { InventoryRecipeDialog } from "../components/InventoryRecipeDialog";

interface InventoryHppScreenProps {
  readonly read: InventoryReadCapability;
  readonly adjust: InventoryAdjustCapability;
  readonly catalog: InventoryCatalogReadPort;
}

export function InventoryHppScreen({ read, adjust, catalog }: InventoryHppScreenProps) {
  const { t } = useTranslation();
  const { message } = AntdApp.useApp();
  const inventory = useInventoryHpp(read, adjust, catalog);
  const [editing, setEditing] = useState<InventoryHppRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="inventory-view">
      {inventory.error ? (
        <Alert
          action={<Button onClick={inventory.retry}>{t("inventory.actions.retry")}</Button>}
          showIcon
          title={t("inventory.hpp.loadError")}
          type="error"
        />
      ) : null}
      <div className="inventory-table">
        <InventoryHppTable loading={inventory.loading} onEdit={setEditing} rows={inventory.rows} />
      </div>
      <InventoryRecipeDialog
        ingredients={inventory.ingredients}
        menu={editing?.menu ?? null}
        onCancel={() => setEditing(null)}
        onSubmit={async (recipe) => {
          setSubmitting(true);
          try {
            await inventory.saveRecipe(recipe);
            setEditing(null);
            void message.success(t("inventory.hpp.saved"));
          } catch {
            void message.error(t("inventory.hpp.saveError"));
          } finally {
            setSubmitting(false);
          }
        }}
        open={Boolean(editing)}
        recipe={editing?.recipe ?? null}
        submitting={submitting}
      />
    </div>
  );
}
