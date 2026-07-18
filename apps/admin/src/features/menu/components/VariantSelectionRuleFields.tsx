import {
  getVariantMaximumOptions,
  getVariantMinimumOptions,
  type VariantSelectionMode,
} from "@warungmeng/domain";
import { Alert, Flex, Form, Radio, Select, Typography, type FormInstance } from "antd";
import { useTranslation } from "react-i18next";
import {
  createSelectionFieldsForMode,
  isVariantSelectionEditorValid,
  type VariantCategoryEditorValues,
} from "../application/variantCategoryEditorModel";

export interface VariantSelectionRuleFieldsProps {
  readonly availableVariants: number;
  readonly form: FormInstance<VariantCategoryEditorValues>;
  readonly totalVariants: number;
}

function toOptions(values: readonly number[]) {
  return values.map((value) => ({ label: String(value), value }));
}

export function VariantSelectionRuleFields({
  availableVariants,
  form,
  totalVariants,
}: VariantSelectionRuleFieldsProps) {
  const { t } = useTranslation();
  const mode =
    Form.useWatch("selectionMode", form) ?? ("optional-unlimited" as VariantSelectionMode);
  const minimum = Form.useWatch("selectionMinimum", form);
  const maximum = Form.useWatch("selectionMaximum", form);
  const minimumOptions = getVariantMinimumOptions(
    Math.min(totalVariants, availableVariants),
    mode === "range" ? (maximum ?? null) : null,
  );
  const maximumOptions = getVariantMaximumOptions(totalVariants, minimum ?? null);

  function handleModeChange(nextMode: VariantSelectionMode): void {
    form.setFieldsValue({
      selectionMode: nextMode,
      selectionMinimum: undefined,
      selectionMaximum: undefined,
      ...createSelectionFieldsForMode(nextMode, totalVariants),
    });
  }

  return (
    <Flex gap="middle" vertical>
      <Typography.Text type="secondary">
        {t("variants.editor.selection.count", {
          available: availableVariants,
          total: totalVariants,
        })}
      </Typography.Text>

      {totalVariants > 0 && availableVariants === 0 ? (
        <Alert
          description={t("variants.editor.selection.noAvailableDescription")}
          showIcon
          title={t("variants.editor.selection.noAvailable")}
          type="warning"
        />
      ) : null}

      <Form.Item
        name="selectionMode"
        rules={[
          {
            validator: async () => {
              const values = form.getFieldsValue(true);
              if (!isVariantSelectionEditorValid(values)) {
                throw new Error(t("variants.editor.validation.selection"));
              }
            },
          },
        ]}
      >
        <Radio.Group
          aria-label={t("variants.editor.selection.label")}
          className="variant-selection-rules"
          onChange={(event) => handleModeChange(event.target.value as VariantSelectionMode)}
        >
          <Flex gap="middle" vertical>
            <Radio value="optional-unlimited">
              {t("variants.editor.selection.optionalUnlimited")}
            </Radio>

            <Flex align="center" gap="small" wrap>
              <Radio value="optional-maximum">
                {t("variants.editor.selection.optionalMaximum")}
              </Radio>
              {mode === "optional-maximum" ? (
                <Form.Item name="selectionMaximum" noStyle>
                  <Select
                    aria-label={t("variants.editor.selection.maximum")}
                    options={toOptions(getVariantMaximumOptions(totalVariants))}
                    style={{ minWidth: "8rem" }}
                  />
                </Form.Item>
              ) : null}
              {mode === "optional-maximum" ? (
                <Typography.Text>{t("variants.editor.selection.variantSuffix")}</Typography.Text>
              ) : null}
            </Flex>

            <Flex align="center" gap="small" wrap>
              <Radio disabled={availableVariants < 1} value="exact">
                {t("variants.editor.selection.exact")}
              </Radio>
              {mode === "exact" ? (
                <Form.Item name="selectionMinimum" noStyle>
                  <Select
                    aria-label={t("variants.editor.selection.exactCount")}
                    options={toOptions(minimumOptions)}
                    style={{ minWidth: "8rem" }}
                  />
                </Form.Item>
              ) : null}
              {mode === "exact" ? (
                <Typography.Text>{t("variants.editor.selection.variantSuffix")}</Typography.Text>
              ) : null}
            </Flex>

            <Flex align="center" gap="small" wrap>
              <Radio disabled={availableVariants < 1} value="minimum">
                {t("variants.editor.selection.minimum")}
              </Radio>
              {mode === "minimum" ? (
                <Form.Item name="selectionMinimum" noStyle>
                  <Select
                    aria-label={t("variants.editor.selection.minimumCount")}
                    options={toOptions(minimumOptions)}
                    style={{ minWidth: "8rem" }}
                  />
                </Form.Item>
              ) : null}
              {mode === "minimum" ? (
                <Typography.Text>{t("variants.editor.selection.variantSuffix")}</Typography.Text>
              ) : null}
            </Flex>

            <Flex align="center" gap="small" wrap>
              <Radio disabled={availableVariants < 1} value="range">
                {t("variants.editor.selection.range")}
              </Radio>
              {mode === "range" ? (
                <>
                  <Form.Item name="selectionMinimum" noStyle>
                    <Select
                      aria-label={t("variants.editor.selection.rangeMinimum")}
                      options={toOptions(minimumOptions)}
                      style={{ minWidth: "8rem" }}
                    />
                  </Form.Item>
                  <Typography.Text>{t("variants.editor.selection.rangeJoin")}</Typography.Text>
                  <Form.Item name="selectionMaximum" noStyle>
                    <Select
                      aria-label={t("variants.editor.selection.rangeMaximum")}
                      options={toOptions(maximumOptions)}
                      style={{ minWidth: "8rem" }}
                    />
                  </Form.Item>
                  <Typography.Text>{t("variants.editor.selection.variantSuffix")}</Typography.Text>
                </>
              ) : null}
            </Flex>
          </Flex>
        </Radio.Group>
      </Form.Item>
    </Flex>
  );
}
