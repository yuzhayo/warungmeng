import { DeleteOutlined, DownOutlined, PlusOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Popconfirm, Switch, Tooltip } from "antd";
import { useTranslation } from "react-i18next";
import type { VariantCategoryEditorValues } from "../application/variantCategoryEditorModel";

export interface VariantCategoryOptionFieldsProps {
  readonly createOptionId: () => string;
}

export function VariantCategoryOptionFields({ createOptionId }: VariantCategoryOptionFieldsProps) {
  const { t } = useTranslation();

  return (
    <Form.List
      name="options"
      rules={[
        {
          validator: async (_, options) => {
            if (!options || options.length < 1) {
              throw new Error(t("variants.editor.validation.optionRequired"));
            }
          },
        },
      ]}
    >
      {(fields, { add, move, remove }, { errors }) => (
        <>
          <div aria-hidden="true" className="variant-option-editor__header">
            <span>{t("variants.editor.options.name")}</span>
            <span>{t("variants.editor.options.price")}</span>
            <span>{t("variants.editor.options.availability")}</span>
            <span>{t("variants.editor.options.actions")}</span>
          </div>

          <div className="variant-option-editor__rows">
            {fields.map((field, index) => (
              <div className="variant-option-editor__row" key={field.key}>
                <Form.Item name={[field.name, "id"]} hidden>
                  <Input />
                </Form.Item>

                <Form.Item
                  name={[field.name, "name"]}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: t("variants.editor.validation.optionName"),
                    },
                  ]}
                >
                  <Input
                    aria-label={t("variants.editor.options.nameFor", { index: index + 1 })}
                    maxLength={120}
                    placeholder={t("variants.editor.options.namePlaceholder")}
                  />
                </Form.Item>

                <Form.Item
                  name={[field.name, "priceAmount"]}
                  rules={[
                    {
                      required: true,
                      type: "integer",
                      min: 0,
                      message: t("variants.editor.validation.price"),
                    },
                  ]}
                >
                  <InputNumber<number>
                    aria-label={t("variants.editor.options.priceFor", { index: index + 1 })}
                    min={0}
                    precision={0}
                    prefix="Rp"
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <Form.Item name={[field.name, "available"]} valuePropName="checked">
                  <Switch
                    aria-label={t("variants.editor.options.availabilityFor", {
                      index: index + 1,
                    })}
                    checkedChildren={t("menu.availability.available")}
                    unCheckedChildren={t("menu.availability.unavailable")}
                  />
                </Form.Item>

                <div className="variant-option-editor__actions">
                  <Tooltip title={t("variants.editor.options.moveUp")}>
                    <Button
                      aria-label={t("variants.editor.options.moveUpFor", { index: index + 1 })}
                      disabled={index === 0}
                      icon={<UpOutlined />}
                      onClick={() => move(index, index - 1)}
                      type="text"
                    />
                  </Tooltip>
                  <Tooltip title={t("variants.editor.options.moveDown")}>
                    <Button
                      aria-label={t("variants.editor.options.moveDownFor", { index: index + 1 })}
                      disabled={index === fields.length - 1}
                      icon={<DownOutlined />}
                      onClick={() => move(index, index + 1)}
                      type="text"
                    />
                  </Tooltip>
                  <Popconfirm
                    cancelText={t("variants.options.actions.cancel")}
                    description={t("variants.editor.options.deleteDescription")}
                    disabled={fields.length === 1}
                    okText={t("variants.options.actions.delete")}
                    onConfirm={() => remove(field.name)}
                    title={t("variants.editor.options.deleteTitle", { index: index + 1 })}
                  >
                    <Button
                      aria-label={t("variants.editor.options.deleteFor", { index: index + 1 })}
                      danger
                      disabled={fields.length === 1}
                      icon={<DeleteOutlined />}
                      type="text"
                    />
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>

          <Form.ErrorList errors={errors} />

          <Button
            icon={<PlusOutlined />}
            onClick={() =>
              add({
                id: createOptionId(),
                name: "",
                priceAmount: 0,
                available: true,
              } satisfies VariantCategoryEditorValues["options"][number])
            }
            type="dashed"
          >
            {t("variants.editor.options.add")}
          </Button>
        </>
      )}
    </Form.List>
  );
}
