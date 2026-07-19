import type { CreateInventoryIngredientInput } from "@warungmeng/data";
import {
  INVENTORY_UNITS,
  type InventoryIngredient,
  type InventorySupplier,
  type InventoryUnit,
} from "@warungmeng/domain";
import type { TranslationKey } from "@warungmeng/i18n";
import { Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface MaterialFormValues {
  readonly name: string;
  readonly baseUnit: InventoryUnit;
  readonly supplierId?: string;
  readonly minimumStock: number;
  readonly initialCost: number;
}

interface InventoryMaterialEditorDialogProps {
  readonly ingredient: InventoryIngredient | null;
  readonly open: boolean;
  readonly suppliers: readonly InventorySupplier[];
  readonly submitting: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (input: CreateInventoryIngredientInput) => Promise<void>;
}

export function InventoryMaterialEditorDialog({
  ingredient,
  open,
  suppliers,
  submitting,
  onCancel,
  onSubmit,
}: InventoryMaterialEditorDialogProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<MaterialFormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: ingredient?.name ?? "",
      baseUnit: ingredient?.baseUnit ?? "g",
      supplierId: ingredient?.supplierId ?? undefined,
      minimumStock: ingredient?.minimumStock ?? 0,
      initialCost: ingredient?.averageUnitCost.amount ?? 0,
    });
  }, [form, ingredient, open]);

  async function submit(values: MaterialFormValues): Promise<void> {
    await onSubmit({
      name: values.name.trim(),
      baseUnit: values.baseUnit,
      supplierId: values.supplierId ?? null,
      status: ingredient?.status ?? "active",
      minimumStock: values.minimumStock,
      lastPurchaseUnitCost: { amount: values.initialCost, currency: "IDR" },
      averageUnitCost: { amount: values.initialCost, currency: "IDR" },
    });
  }

  return (
    <Modal
      cancelText={t("inventory.actions.cancel")}
      confirmLoading={submitting}
      destroyOnHidden
      okText={t("inventory.actions.save")}
      onCancel={onCancel}
      onOk={() => form.submit()}
      open={open}
      title={
        ingredient
          ? t("inventory.materials.edit", { name: ingredient.name })
          : t("inventory.materials.create")
      }
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          label={t("inventory.materials.name")}
          name="name"
          rules={[
            { required: true, whitespace: true, message: t("inventory.validation.required") },
          ]}
        >
          <Input autoFocus />
        </Form.Item>
        <div className="inventory-form-row">
          <Form.Item
            label={t("inventory.materials.baseUnit")}
            name="baseUnit"
            rules={[{ required: true, message: t("inventory.validation.required") }]}
          >
            <Select
              options={INVENTORY_UNITS.map((unit) => ({
                value: unit,
                label: t(`inventory.unit.${unit}` as TranslationKey),
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t("inventory.materials.minimumStock")}
            name="minimumStock"
            rules={[
              {
                required: true,
                type: "number",
                min: 0,
                message: t("inventory.validation.nonNegative"),
              },
            ]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <Form.Item label={t("inventory.materials.supplier")} name="supplierId">
          <Select
            allowClear
            options={suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))}
          />
        </Form.Item>
        <Form.Item
          label={t("inventory.materials.initialCost")}
          name="initialCost"
          rules={[
            {
              required: true,
              type: "number",
              min: 0,
              message: t("inventory.validation.nonNegative"),
            },
          ]}
        >
          <InputNumber
            disabled={Boolean(ingredient)}
            min={0}
            precision={2}
            prefix="Rp"
            style={{ width: "100%" }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
