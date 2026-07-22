import { useId } from "react";
import { Checkbox, Radio, Typography } from "antd";
import type { MenuVariantGroup, MenuVariantOption } from "@warungmeng/domain";
import { deriveVariantSelectionMode } from "@warungmeng/domain";
import { formatRupiah } from "@warungmeng/i18n";
import { useTranslation } from "react-i18next";
import { isVariantOptionSelectable } from "../application/menuDetailModel";
import styles from "../MenuDetail.module.css";

const { Text } = Typography;

interface VariantGroupSelectorProps {
  group: MenuVariantGroup;
  selectedOptionIds: readonly string[];
  onSelectionChange: (groupId: string, optionIds: readonly string[]) => void;
  showError: boolean;
}

function useRuleGuidance(group: MenuVariantGroup): string {
  const { t } = useTranslation();
  const mode = deriveVariantSelectionMode(group.selection);
  const { minSelections, maxSelections } = group.selection;

  switch (mode) {
    case "optional-unlimited":
      return t("storefront.detail.rule.optionalUnlimited");
    case "optional-maximum":
      return t("storefront.detail.rule.optionalMaximum", { max: maxSelections });
    case "exact":
      return t("storefront.detail.rule.exact", { count: minSelections });
    case "minimum":
      return t("storefront.detail.rule.minimum", { min: minSelections });
    case "range":
      return t("storefront.detail.rule.range", { min: minSelections, max: maxSelections });
  }
}

function OptionLabel({ option }: { option: MenuVariantOption }) {
  const { t } = useTranslation();
  const selectable = isVariantOptionSelectable(option);

  return (
    <span className={styles.optionRow}>
      <span>{option.name}</span>
      <span className={styles.optionMeta}>
        {option.priceAdjustment.amount !== 0
          ? `${option.priceAdjustment.amount > 0 ? "+" : "−"}${formatRupiah(
              Math.abs(option.priceAdjustment.amount),
              { regionalFormat: "id-ID" },
            )}`
          : null}
        {!selectable ? <Text type="danger"> {t("storefront.menu.unavailable")}</Text> : null}
      </span>
    </span>
  );
}

export function VariantGroupSelector({
  group,
  selectedOptionIds,
  onSelectionChange,
  showError,
}: VariantGroupSelectorProps) {
  const { t } = useTranslation();
  const errorId = useId();
  const guidance = useRuleGuidance(group);
  const mode = deriveVariantSelectionMode(group.selection);
  const isSingleExact = mode === "exact" && group.selection.minSelections === 1;
  const maximum = group.selection.maxSelections ?? Number.POSITIVE_INFINITY;
  const maxReached = selectedOptionIds.length >= maximum;

  const toggleOption = (optionId: string, checked: boolean) => {
    const next = checked
      ? [...selectedOptionIds, optionId]
      : selectedOptionIds.filter((id) => id !== optionId);
    onSelectionChange(group.id, next);
  };

  return (
    <fieldset className={styles.groupFieldset} aria-describedby={showError ? errorId : undefined}>
      <legend className={styles.groupLegend}>{group.name}</legend>
      <p className={styles.groupGuidance}>{guidance}</p>
      {isSingleExact ? (
        <Radio.Group
          className={styles.optionList}
          value={selectedOptionIds[0] ?? null}
          onChange={(event) => onSelectionChange(group.id, [event.target.value as string])}
        >
          {group.options.map((option) => (
            <Radio key={option.id} value={option.id} disabled={!isVariantOptionSelectable(option)}>
              <OptionLabel option={option} />
            </Radio>
          ))}
        </Radio.Group>
      ) : (
        <div className={styles.optionList} role="group" aria-label={group.name}>
          {group.options.map((option) => {
            const checked = selectedOptionIds.includes(option.id);
            const disabled = !isVariantOptionSelectable(option) || (!checked && maxReached);
            return (
              <Checkbox
                key={option.id}
                checked={checked}
                disabled={disabled}
                onChange={(event) => toggleOption(option.id, event.target.checked)}
              >
                <OptionLabel option={option} />
              </Checkbox>
            );
          })}
        </div>
      )}
      {showError ? (
        <p className={styles.groupError} id={errorId} role="alert">
          {t("storefront.detail.rule.error")}
        </p>
      ) : null}
    </fieldset>
  );
}
