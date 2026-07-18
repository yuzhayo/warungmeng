import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import { Button, Card, Flex, Form, Popconfirm, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  createMenuEditorInput,
  validateMenuEditorValues,
  type MenuEditorInput,
  type MenuEditorValues,
} from "../application/menuEditorModel";
import { MenuEditorAvailabilityFields } from "./MenuEditorAvailabilityFields";
import { MenuEditorDetailsFields } from "./MenuEditorDetailsFields";
import { MenuEditorSalesScheduleFields } from "./MenuEditorSalesScheduleFields";
import { MenuEditorVariantFields } from "./MenuEditorVariantFields";

export interface MenuEditorFormProps {
  readonly baseline: MenuItem | null;
  readonly categories: readonly MenuCategory[];
  readonly initialValues: MenuEditorValues;
  readonly mode: "create" | "edit";
  readonly sortOrder: number;
  readonly variantGroups: readonly MenuVariantGroup[];
  readonly deleting: boolean;
  readonly onCancel: () => void;
  readonly onDelete?: () => Promise<void>;
  readonly onSubmit: (input: MenuEditorInput) => Promise<void>;
}

export function MenuEditorForm({
  baseline,
  categories,
  initialValues,
  mode,
  sortOrder,
  variantGroups,
  deleting,
  onCancel,
  onDelete,
  onSubmit,
}: MenuEditorFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<MenuEditorValues>();
  const [submitting, setSubmitting] = useState(false);
  const available = Form.useWatch("available", form) ?? initialValues.available;
  const visible = Form.useWatch("visible", form) ?? initialValues.visible;
  const inventoryMode = Form.useWatch("inventoryMode", form) ?? initialValues.inventoryMode;
  const salesMode = Form.useWatch("salesMode", form) ?? initialValues.salesMode;
  const allDay = Form.useWatch("allDay", form) ?? initialValues.allDay;
  const imageUrl = Form.useWatch("imageUrl", form) ?? initialValues.imageUrl;
  const menuName = Form.useWatch("name", form) ?? initialValues.name;

  async function handleFinish(values: MenuEditorValues): Promise<void> {
    const issues = validateMenuEditorValues(values, baseline, sortOrder);
    if (issues.length > 0) {
      const scheduleIssue = issues.some((issue) => issue.path.startsWith("salesSchedule"));
      if (scheduleIssue) {
        form.setFields([
          {
            name: "intervals",
            errors: [t("menu.editor.validation.schedule")],
          },
        ]);
      }
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(createMenuEditorInput(values, baseline, sortOrder));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Form
      form={form}
      initialValues={initialValues}
      layout="vertical"
      name={`menu-editor-${mode}`}
      onFinish={(values) => void handleFinish(values)}
      scrollToFirstError={{ focus: true }}
    >
      <Flex align="center" gap="middle" justify="space-between" wrap>
        <div>
          <Typography.Title level={3}>
            {t(mode === "create" ? "menu.editor.createTitle" : "menu.editor.editTitle")}
          </Typography.Title>
          <Typography.Text type="secondary">{t("menu.editor.description")}</Typography.Text>
        </div>
        <Flex gap="small">
          {mode === "edit" && onDelete ? (
            <Popconfirm
              cancelText={t("menu.editor.actions.cancel")}
              description={t("menu.editor.delete.description")}
              okButtonProps={{ danger: true, loading: deleting }}
              okText={t("menu.editor.actions.delete")}
              onConfirm={onDelete}
              title={t("menu.editor.delete.title", { name: menuName })}
            >
              <Button danger disabled={submitting || deleting} loading={deleting}>
                {t("menu.editor.actions.delete")}
              </Button>
            </Popconfirm>
          ) : null}
          <Button disabled={submitting} onClick={onCancel}>
            {t("menu.editor.actions.cancel")}
          </Button>
          <Button disabled={deleting} htmlType="submit" loading={submitting} type="primary">
            {t("menu.editor.actions.save")}
          </Button>
        </Flex>
      </Flex>

      <Card title={t("menu.editor.details.title")}>
        <MenuEditorDetailsFields categories={categories} imageUrl={imageUrl} menuName={menuName} />
      </Card>

      <Card title={t("menu.editor.availability.title")}>
        <MenuEditorAvailabilityFields
          available={available}
          inventoryMode={inventoryMode}
          visible={visible}
        />
      </Card>

      <Card title={t("menu.editor.schedule.title")}>
        <MenuEditorSalesScheduleFields allDay={allDay} salesMode={salesMode} />
      </Card>

      <Card title={t("menu.editor.variants.title")}>
        <Form.Item name="variantGroupIds" noStyle>
          <MenuEditorVariantFields groups={variantGroups} />
        </Form.Item>
      </Card>
    </Form>
  );
}
