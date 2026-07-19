import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  INVENTORY_UNITS,
  areInventoryUnitsCompatible,
  type InventoryIngredient,
  type InventoryUnit,
  type MenuItem,
  type MenuRecipe,
} from "@warungmeng/domain";
import type { TranslationKey } from "@warungmeng/i18n";
import { Button, Form, InputNumber, Modal, Select } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface RecipeComponentValues {
  readonly ingredientId: string;
  readonly quantity: number;
  readonly unit: InventoryUnit;
  readonly wastePercentage: number;
}

interface RecipeFormValues {
  readonly components: readonly RecipeComponentValues[];
  readonly packagingCost: number;
  readonly additionalCost: number;
}

interface RecipeComponentRowProps {
  readonly fieldName: number;
  readonly form: ReturnType<typeof Form.useForm<RecipeFormValues>>[0];
  readonly ingredients: readonly InventoryIngredient[];
  readonly onRemove: () => void;
}

function RecipeComponentRow({ fieldName, form, ingredients, onRemove }: RecipeComponentRowProps) {
  const { t } = useTranslation();
  const ingredientId = Form.useWatch(["components", fieldName, "ingredientId"], form);
  const ingredient = ingredients.find((item) => item.id === ingredientId);
  const units = INVENTORY_UNITS.filter(
    (unit) => !ingredient || areInventoryUnitsCompatible(unit, ingredient.baseUnit),
  );

  useEffect(() => {
    if (!ingredient) return;
    const currentUnit = form.getFieldValue(["components", fieldName, "unit"]);
    if (!currentUnit || !areInventoryUnitsCompatible(currentUnit, ingredient.baseUnit)) {
      form.setFieldValue(["components", fieldName, "unit"], ingredient.baseUnit);
    }
  }, [fieldName, form, ingredient]);

  return (
    <div className="inventory-recipe-row">
      <Form.Item
        name={[fieldName, "ingredientId"]}
        rules={[{ required: true, message: t("inventory.validation.required") }]}
      >
        <Select
          aria-label={t("inventory.movements.ingredient")}
          options={ingredients.map((item) => ({ value: item.id, label: item.name }))}
          placeholder={t("inventory.movements.ingredient")}
          showSearch={{ optionFilterProp: "label" }}
        />
      </Form.Item>
      <Form.Item
        name={[fieldName, "quantity"]}
        rules={[
          {
            required: true,
            type: "number",
            min: 0.01,
            message: t("inventory.validation.positive"),
          },
        ]}
      >
        <InputNumber
          aria-label={t("inventory.movements.quantity")}
          min={0.01}
          precision={2}
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Form.Item
        name={[fieldName, "unit"]}
        rules={[{ required: true, message: t("inventory.validation.required") }]}
      >
        <Select
          aria-label={t("inventory.movements.unit")}
          options={units.map((unit) => ({
            value: unit,
            label: t(`inventory.unit.${unit}` as TranslationKey),
          }))}
        />
      </Form.Item>
      <Form.Item
        name={[fieldName, "wastePercentage"]}
        rules={[
          {
            required: true,
            type: "number",
            min: 0,
            max: 100,
            message: t("inventory.validation.nonNegative"),
          },
        ]}
      >
        <InputNumber
          aria-label={t("inventory.hpp.wasteAllowance")}
          min={0}
          max={100}
          precision={2}
          suffix="%"
          style={{ width: "100%" }}
        />
      </Form.Item>
      <Button
        aria-label={t("inventory.hpp.removeComponent")}
        danger
        icon={<DeleteOutlined />}
        onClick={onRemove}
        type="text"
      />
    </div>
  );
}

interface InventoryRecipeDialogProps {
  readonly ingredients: readonly InventoryIngredient[];
  readonly menu: MenuItem | null;
  readonly open: boolean;
  readonly recipe: MenuRecipe | null;
  readonly submitting: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (recipe: MenuRecipe) => Promise<void>;
}

export function InventoryRecipeDialog({
  ingredients,
  menu,
  open,
  recipe,
  submitting,
  onCancel,
  onSubmit,
}: InventoryRecipeDialogProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<RecipeFormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      components: (recipe?.components ?? []).map((component) => ({
        ingredientId: component.ingredientId,
        quantity: component.quantity,
        unit: component.unit,
        wastePercentage: component.wastePercentage,
      })),
      packagingCost: recipe?.packagingCost.amount ?? 0,
      additionalCost: recipe?.additionalCost.amount ?? 0,
    });
  }, [form, open, recipe]);

  async function submit(values: RecipeFormValues): Promise<void> {
    if (!menu) return;
    await onSubmit({
      menuItemId: menu.id,
      components: values.components.map((component, index) => ({
        id: recipe?.components[index]?.id ?? `recipe-${menu.id}-${index + 1}`,
        ...component,
      })),
      packagingCost: { amount: values.packagingCost, currency: "IDR" },
      additionalCost: { amount: values.additionalCost, currency: "IDR" },
      updatedAt: new Date().toISOString(),
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
      title={menu ? t("inventory.hpp.edit", { name: menu.name }) : t("inventory.hpp.recipe")}
      width="min(60rem, calc(100vw - 2rem))"
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.List
          name="components"
          rules={[
            {
              validator: async (_, components: readonly RecipeComponentValues[]) => {
                if (!components?.length) throw new Error(t("inventory.validation.recipeComponent"));
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              {fields.map((field) => (
                <RecipeComponentRow
                  fieldName={field.name}
                  form={form}
                  ingredients={ingredients}
                  key={field.key}
                  onRemove={() => remove(field.name)}
                />
              ))}
              <Form.ErrorList errors={errors} />
              <Button
                block
                icon={<PlusOutlined />}
                onClick={() => add({ quantity: 1, unit: "g", wastePercentage: 0 })}
                type="dashed"
              >
                {t("inventory.hpp.addComponent")}
              </Button>
            </>
          )}
        </Form.List>
        <div className="inventory-form-row">
          <Form.Item
            label={t("inventory.hpp.packaging")}
            name="packagingCost"
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
          <Form.Item
            label={t("inventory.hpp.additional")}
            name="additionalCost"
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
        </div>
      </Form>
    </Modal>
  );
}
