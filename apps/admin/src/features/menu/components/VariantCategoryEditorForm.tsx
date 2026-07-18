import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import { Button, Card, Flex, Form, Input, Switch, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createVariantCategoryEditorInput,
  isVariantSelectionEditorValid,
  normalizeVariantSelectionEditorFields,
  type VariantCategoryEditorInput,
  type VariantCategoryEditorValues,
} from "../application/variantCategoryEditorModel";
import { VariantCategoryOptionFields } from "./VariantCategoryOptionFields";
import { VariantConnectedMenuFields } from "./VariantConnectedMenuFields";
import { VariantSelectionRuleFields } from "./VariantSelectionRuleFields";

export interface VariantCategoryEditorFormProps {
  readonly baseline: MenuVariantGroup | null;
  readonly categories: readonly MenuCategory[];
  readonly initialValues: VariantCategoryEditorValues;
  readonly menus: readonly MenuItem[];
  readonly mode: "create" | "edit";
  readonly sortOrder: number;
  readonly onCancel: () => void;
  readonly onSubmit: (
    input: VariantCategoryEditorInput,
    connectedMenuIds: readonly string[],
  ) => Promise<void>;
}

function createOptionId(): string {
  return `variant-option-${crypto.randomUUID()}`;
}

export function VariantCategoryEditorForm({
  baseline,
  categories,
  initialValues,
  menus,
  mode,
  sortOrder,
  onCancel,
  onSubmit,
}: VariantCategoryEditorFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<VariantCategoryEditorValues>();
  const [submitting, setSubmitting] = useState(false);
  const options = Form.useWatch("options", form) ?? initialValues.options;
  const visible = Form.useWatch("visible", form) ?? initialValues.visible;
  const availableVariants = useMemo(
    () => options.filter((option) => option.available).length,
    [options],
  );

  async function handleFinish(values: VariantCategoryEditorValues): Promise<void> {
    if (!isVariantSelectionEditorValid(values)) {
      form.setFields([
        {
          name: "selectionMode",
          errors: [t("variants.editor.validation.selection")],
        },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        createVariantCategoryEditorInput(values, baseline, sortOrder),
        values.connectedMenuIds,
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleValuesChange(
    changedValues: Partial<VariantCategoryEditorValues>,
    values: VariantCategoryEditorValues,
  ): void {
    if (!changedValues.options) return;
    form.setFieldsValue(normalizeVariantSelectionEditorFields(values, values.options?.length ?? 0));
    void form.validateFields(["selectionMode"]).catch(() => undefined);
  }

  return (
    <Form
      form={form}
      initialValues={initialValues}
      layout="vertical"
      name={`variant-category-${mode}`}
      onFinish={(values) => void handleFinish(values)}
      onValuesChange={handleValuesChange}
      scrollToFirstError={{ focus: true }}
    >
      <Flex align="center" gap="middle" justify="space-between" wrap>
        <div>
          <Typography.Title level={3}>
            {t(mode === "create" ? "variants.editor.createTitle" : "variants.editor.editTitle")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("variants.editor.description")}</Typography.Text>
        </div>

        <Flex gap="small">
          <Button disabled={submitting} onClick={onCancel}>
            {t("variants.editor.actions.cancel")}
          </Button>
          <Button htmlType="submit" loading={submitting} type="primary">
            {t("variants.editor.actions.save")}
          </Button>
        </Flex>
      </Flex>

      <Card title={t("variants.editor.details.title")}>
        <div className="variant-category-editor__details">
          <Form.Item
            label={t("variants.editor.details.name")}
            name="name"
            rules={[
              {
                required: true,
                whitespace: true,
                message: t("variants.editor.validation.name"),
              },
            ]}
          >
            <Input maxLength={120} placeholder={t("variants.editor.details.namePlaceholder")} />
          </Form.Item>

          <Form.Item label={t("variants.editor.details.visibility")}>
            <Flex align="center" gap="small">
              <Form.Item name="visible" noStyle valuePropName="checked">
                <Switch aria-label={t("variants.editor.details.visibility")} />
              </Form.Item>
              <Typography.Text>
                {t(visible ? "menu.visibility.visible" : "menu.visibility.hidden")}
              </Typography.Text>
            </Flex>
          </Form.Item>
        </div>

        <Form.Item label={t("variants.editor.details.note")} name="description">
          <Input.TextArea
            maxLength={500}
            placeholder={t("variants.editor.details.notePlaceholder")}
            rows={3}
            showCount
          />
        </Form.Item>
      </Card>

      <Card
        title={t("variants.editor.options.title", {
          count: options.length,
        })}
      >
        <VariantCategoryOptionFields createOptionId={createOptionId} />
      </Card>

      <Card title={t("variants.editor.selection.title")}>
        <VariantSelectionRuleFields
          availableVariants={availableVariants}
          form={form}
          totalVariants={options.length}
        />
      </Card>

      <Card title={t("variants.editor.connectedMenus.title")}>
        <Form.Item name="connectedMenuIds" noStyle>
          <VariantConnectedMenuFields categories={categories} menus={menus} />
        </Form.Item>
      </Card>
    </Form>
  );
}
