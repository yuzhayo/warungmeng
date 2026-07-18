import type { CreateEntity } from "@warungmeng/data";
import type { MenuCategory } from "@warungmeng/domain";
import { Flex, Form, Input, Modal, Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { slugifyMenuName } from "../application/menuEditorModel";

interface MenuCategoryCreateValues {
  readonly name: string;
  readonly visible: boolean;
}

export interface MenuCategoryCreateDialogProps {
  readonly nextSortOrder: number;
  readonly open: boolean;
  readonly submitting: boolean;
  readonly onCancel: () => void;
  readonly onSubmit: (input: CreateEntity<MenuCategory>) => Promise<void>;
}

export function MenuCategoryCreateDialog({
  nextSortOrder,
  open,
  submitting,
  onCancel,
  onSubmit,
}: MenuCategoryCreateDialogProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<MenuCategoryCreateValues>();
  const visible = Form.useWatch("visible", form) ?? true;

  return (
    <Modal
      afterOpenChange={(isOpen) => {
        if (!isOpen) form.resetFields();
      }}
      cancelText={t("menu.categoryDialog.actions.cancel")}
      confirmLoading={submitting}
      destroyOnHidden
      okText={t("menu.categoryDialog.actions.create")}
      onCancel={onCancel}
      onOk={() => form.submit()}
      open={open}
      title={t("menu.categoryDialog.title")}
    >
      <Form
        form={form}
        initialValues={{ name: "", visible: true }}
        layout="vertical"
        onFinish={(values) =>
          void onSubmit({
            name: values.name.trim(),
            slug: slugifyMenuName(values.name),
            visibility: values.visible ? "visible" : "hidden",
            sortOrder: nextSortOrder,
          })
        }
      >
        <Form.Item
          label={t("menu.categoryDialog.name")}
          name="name"
          rules={[
            {
              required: true,
              whitespace: true,
              message: t("menu.categoryDialog.validation.name"),
            },
          ]}
        >
          <Input autoFocus maxLength={80} placeholder={t("menu.categoryDialog.namePlaceholder")} />
        </Form.Item>

        <Form.Item label={t("menu.categoryDialog.visibility")}>
          <Flex align="center" gap="small">
            <Form.Item name="visible" noStyle valuePropName="checked">
              <Switch aria-label={t("menu.categoryDialog.visibility")} />
            </Form.Item>
            <Typography.Text>
              {t(visible ? "menu.visibility.visible" : "menu.visibility.hidden")}
            </Typography.Text>
          </Flex>
        </Form.Item>
      </Form>
    </Modal>
  );
}
