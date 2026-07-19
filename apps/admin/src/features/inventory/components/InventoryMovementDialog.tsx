import type { CreateInventoryMovementInput } from "@warungmeng/data";
import {
  INVENTORY_UNITS,
  areInventoryUnitsCompatible,
  type InventoryIngredient,
  type InventoryMovementType,
  type InventoryUnit,
} from "@warungmeng/domain";
import type { TranslationKey } from "@warungmeng/i18n";
import { Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { INVENTORY_MOVEMENT_TYPES, INVENTORY_OUTLETS } from "../application/inventoryConstants";

interface MovementFormValues {
  readonly ingredientId: string;
  readonly outletId: string;
  readonly type: InventoryMovementType;
  readonly quantity: number;
  readonly unit: InventoryUnit;
  readonly unitCost?: number;
  readonly note: string;
}

interface InventoryMovementDialogProps {
  readonly ingredients: readonly InventoryIngredient[];
  readonly open: boolean;
  readonly submitting: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (input: CreateInventoryMovementInput) => Promise<void>;
}

export function InventoryMovementDialog({
  ingredients,
  open,
  submitting,
  onCancel,
  onSubmit,
}: InventoryMovementDialogProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<MovementFormValues>();
  const movementType = Form.useWatch("type", form);
  const ingredientId = Form.useWatch("ingredientId", form);
  const ingredient = ingredients.find((item) => item.id === ingredientId);
  const unitOptions = INVENTORY_UNITS.filter(
    (unit) => !ingredient || areInventoryUnitsCompatible(unit, ingredient.baseUnit),
  ).map((unit) => ({ value: unit, label: t(`inventory.unit.${unit}` as TranslationKey) }));

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      outletId: "wm-1",
      type: "purchase",
      quantity: 1,
      unit: "g",
      note: "",
    });
  }, [form, open]);

  useEffect(() => {
    if (ingredient) form.setFieldValue("unit", ingredient.baseUnit);
  }, [form, ingredient]);

  async function submit(values: MovementFormValues): Promise<void> {
    await onSubmit({
      ingredientId: values.ingredientId,
      outletId: values.outletId,
      type: values.type,
      quantity: values.quantity,
      unit: values.unit,
      unitCost:
        values.type === "purchase" ? { amount: values.unitCost ?? 0, currency: "IDR" } : null,
      referenceId: null,
      note: values.note.trim(),
      occurredAt: new Date().toISOString(),
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
      title={t("inventory.movements.record")}
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <div className="inventory-form-row">
          <Form.Item
            label={t("inventory.movements.ingredient")}
            name="ingredientId"
            rules={[{ required: true, message: t("inventory.validation.required") }]}
          >
            <Select
              autoFocus
              options={ingredients.map((item) => ({ value: item.id, label: item.name }))}
              showSearch={{ optionFilterProp: "label" }}
            />
          </Form.Item>
          <Form.Item
            label={t("inventory.outlet")}
            name="outletId"
            rules={[{ required: true, message: t("inventory.validation.required") }]}
          >
            <Select
              options={INVENTORY_OUTLETS.map((outlet) => ({
                value: outlet.id,
                label: t(outlet.nameKey),
              }))}
            />
          </Form.Item>
        </div>
        <Form.Item
          label={t("inventory.movements.type")}
          name="type"
          rules={[{ required: true, message: t("inventory.validation.required") }]}
        >
          <Select
            options={INVENTORY_MOVEMENT_TYPES.map((type) => ({
              value: type,
              label: t(`inventory.movements.${type}` as TranslationKey),
            }))}
          />
        </Form.Item>
        <div className="inventory-form-row">
          <Form.Item
            label={t("inventory.movements.quantity")}
            name="quantity"
            rules={[
              {
                required: true,
                type: "number",
                min: 0.01,
                message: t("inventory.validation.positive"),
              },
            ]}
          >
            <InputNumber min={0.01} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label={t("inventory.movements.unit")}
            name="unit"
            rules={[{ required: true, message: t("inventory.validation.required") }]}
          >
            <Select options={unitOptions} />
          </Form.Item>
        </div>
        {movementType === "purchase" ? (
          <Form.Item
            label={t("inventory.movements.unitCost")}
            name="unitCost"
            rules={[
              {
                required: true,
                type: "number",
                min: 0,
                message: t("inventory.validation.nonNegative"),
              },
            ]}
          >
            <InputNumber min={0} precision={2} prefix="Rp" style={{ width: "100%" }} />
          </Form.Item>
        ) : null}
        <Form.Item label={t("inventory.movements.note")} name="note">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
