import type { MenuCategory } from "@warungmeng/domain";
import {
  Avatar,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  type InputNumberProps,
} from "antd";
import { useTranslation } from "react-i18next";

export interface MenuEditorDetailsFieldsProps {
  readonly categories: readonly MenuCategory[];
  readonly imageUrl: string;
  readonly menuName: string;
}

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

function RupiahInput(props: InputNumberProps<number>) {
  return (
    <Space.Compact block>
      <Space.Addon>Rp</Space.Addon>
      <InputNumber<number>
        {...props}
        controls={false}
        formatter={(value) => rupiahFormatter.format(Number(value ?? 0))}
        min={0}
        parser={(value) => Number(value?.replace(/\D/g, "") ?? 0)}
        precision={0}
        style={{ width: "100%" }}
      />
    </Space.Compact>
  );
}

export function MenuEditorDetailsFields({
  categories,
  imageUrl,
  menuName,
}: MenuEditorDetailsFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="menu-editor__details-grid">
        <Form.Item
          label={t("menu.editor.details.name")}
          name="name"
          rules={[
            {
              required: true,
              whitespace: true,
              message: t("menu.editor.validation.name"),
            },
          ]}
        >
          <Input maxLength={120} placeholder={t("menu.editor.details.namePlaceholder")} />
        </Form.Item>

        <Form.Item
          label={t("menu.editor.details.category")}
          name="categoryId"
          rules={[{ required: true, message: t("menu.editor.validation.category") }]}
        >
          <Select
            options={categories.map((category) => ({
              label: category.name,
              value: category.id,
            }))}
            placeholder={t("menu.editor.details.categoryPlaceholder")}
            showSearch={{ optionFilterProp: "label" }}
          />
        </Form.Item>

        <Form.Item
          label={t("menu.editor.details.price")}
          name="priceAmount"
          rules={[
            {
              required: true,
              type: "number",
              min: 0,
              message: t("menu.editor.validation.price"),
            },
          ]}
        >
          <RupiahInput />
        </Form.Item>

        <Form.Item label={t("menu.editor.details.photoUrl")} name="imageUrl">
          <Input placeholder={t("menu.editor.details.photoUrlPlaceholder")} type="url" />
        </Form.Item>
      </div>

      <Flex align="center" className="menu-editor__photo-preview" gap="middle">
        <Avatar
          alt={menuName || t("menu.editor.details.photoPreview")}
          shape="square"
          size={72}
          src={imageUrl || undefined}
        >
          {(menuName || "M").slice(0, 1)}
        </Avatar>
        <div>
          <Typography.Text strong>{t("menu.editor.details.photoPreview")}</Typography.Text>
          <br />
          <Typography.Text type="secondary">{t("menu.editor.details.photoHelp")}</Typography.Text>
        </div>
      </Flex>

      <Form.Item label={t("menu.editor.details.description")} name="description">
        <Input.TextArea
          maxLength={500}
          placeholder={t("menu.editor.details.descriptionPlaceholder")}
          rows={3}
          showCount
        />
      </Form.Item>
    </>
  );
}
