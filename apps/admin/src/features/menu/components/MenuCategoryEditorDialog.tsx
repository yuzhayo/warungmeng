import type { CreateEntity } from "@warungmeng/data";
import type { MenuCategory } from "@warungmeng/domain";
import { Button, Flex, Form, Input, Modal, Popconfirm, Switch, Typography } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { slugifyMenuName } from "../application/menuEditorModel";

interface MenuCategoryEditorValues {
  readonly name: string;
  readonly visible: boolean;
}

export type MenuCategoryEditorInput = CreateEntity<MenuCategory>;

export interface MenuCategoryEditorDialogProps {
  readonly category: MenuCategory | null;
  readonly deleting: boolean;
  readonly nextSortOrder: number;
  readonly open: boolean;
  readonly submitting: boolean;
  readonly onCancel: () => void;
  readonly onDelete: () => Promise<void>;
  readonly onSubmit: (input: MenuCategoryEditorInput) => Promise<void>;
}

export function MenuCategoryEditorDialog({
  category,
  deleting,
  nextSortOrder,
  open,
  submitting,
  onCancel,
  onDelete,
  onSubmit,
}: MenuCategoryEditorDialogProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<MenuCategoryEditorValues>();
  const visible = Form.useWatch("visible", form) ?? category?.visibility !== "hidden";
  const mode = category ? "edit" : "create";

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: category?.name ?? "",
        visible: category?.visibility !== "hidden",
      });
    } else {
      form.resetFields();
    }
  }, [category, form, open]);

  return (
    <Modal
      cancelText={t("menu.categoryDialog.actions.cancel")}
      confirmLoading={submitting}
      destroyOnHidden
      footer={(_, { CancelBtn, OkBtn }) => (
        <Flex align="center" justify="space-between">
          {category ? (
            <Popconfirm
              cancelText={t("menu.categoryDialog.actions.cancel")}
              description={t("menu.categoryDialog.delete.description")}
              okButtonProps={{ danger: true, loading: deleting }}
              okText={t("menu.categoryDialog.actions.delete")}
              onConfirm={() => void onDelete()}
              title={t("menu.categoryDialog.delete.title", { name: category.name })}
            >
              <Button danger disabled={deleting || submitting}>
                {t("menu.categoryDialog.actions.delete")}
              </Button>
            </Popconfirm>
          ) : (
            <span />
          )}
          <Flex gap="small">
            <CancelBtn />
            <OkBtn />
          </Flex>
        </Flex>
      )}
      okText={t(
        mode === "create"
          ? "menu.categoryDialog.actions.create"
          : "menu.categoryDialog.actions.save",
      )}
      onCancel={onCancel}
      onOk={() => form.submit()}
      open={open}
      title={t(
        mode === "create" ? "menu.categoryDialog.createTitle" : "menu.categoryDialog.editTitle",
      )}
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
            sortOrder: category?.sortOrder ?? nextSortOrder,
          })
        }
        preserve={false}
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
