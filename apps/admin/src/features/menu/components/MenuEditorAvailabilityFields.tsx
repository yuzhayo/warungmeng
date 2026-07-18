import { Flex, Form, InputNumber, Radio, Switch, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type { MenuEditorInventoryMode, MenuEditorValues } from "../application/menuEditorModel";

export interface MenuEditorAvailabilityFieldsProps {
  readonly available: boolean;
  readonly inventoryMode: MenuEditorInventoryMode;
  readonly visible: boolean;
}

export function MenuEditorAvailabilityFields({
  available,
  inventoryMode,
  visible,
}: MenuEditorAvailabilityFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="menu-editor__availability-grid">
      <Form.Item label={t("menu.editor.availability.stockStatus")}>
        <Flex align="center" gap="small">
          <Form.Item<MenuEditorValues> name="available" noStyle valuePropName="checked">
            <Switch aria-label={t("menu.editor.availability.stockStatus")} />
          </Form.Item>
          <Typography.Text>
            {t(available ? "menu.availability.available" : "menu.availability.unavailable")}
          </Typography.Text>
        </Flex>
      </Form.Item>

      <Form.Item label={t("menu.editor.availability.visibility")}>
        <Flex align="center" gap="small">
          <Form.Item<MenuEditorValues> name="visible" noStyle valuePropName="checked">
            <Switch aria-label={t("menu.editor.availability.visibility")} />
          </Form.Item>
          <Typography.Text>
            {t(visible ? "menu.visibility.visible" : "menu.visibility.hidden")}
          </Typography.Text>
        </Flex>
      </Form.Item>

      <Form.Item label={t("menu.editor.availability.inventoryMode")} name="inventoryMode">
        <Radio.Group
          options={[
            {
              label: t("menu.editor.availability.untracked"),
              value: "untracked",
            },
            {
              label: t("menu.editor.availability.tracked"),
              value: "tracked",
            },
          ]}
        />
      </Form.Item>

      {inventoryMode === "tracked" ? (
        <Form.Item
          label={t("menu.editor.availability.quantity")}
          name="stockQuantity"
          rules={[
            {
              required: true,
              type: "number",
              min: 0,
              message: t("menu.editor.validation.stock"),
            },
          ]}
        >
          <InputNumber<number> min={0} precision={0} style={{ width: "100%" }} />
        </Form.Item>
      ) : null}
    </div>
  );
}
