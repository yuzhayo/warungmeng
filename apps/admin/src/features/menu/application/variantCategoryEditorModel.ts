import type {
  MenuVariantGroup,
  MenuVariantOption,
  VariantSelectionMode,
  VariantSelectionRule,
} from "@warungmeng/domain";
import {
  createVariantSelectionRule,
  deriveVariantSelectionMode,
  normalizeVariantSelectionRule,
  validateVariantSelectionRule,
} from "@warungmeng/domain";

export interface VariantOptionEditorValue {
  readonly id: string;
  readonly name: string;
  readonly priceAmount: number;
  readonly available: boolean;
}

export interface VariantCategoryEditorValues {
  readonly name: string;
  readonly description: string;
  readonly visible: boolean;
  readonly options: readonly VariantOptionEditorValue[];
  readonly selectionMode: VariantSelectionMode;
  readonly selectionMinimum?: number;
  readonly selectionMaximum?: number;
}

export interface VariantSelectionEditorFields {
  readonly selectionMinimum?: number;
  readonly selectionMaximum?: number;
}

export type VariantCategoryEditorInput = Omit<MenuVariantGroup, "id">;

export function createVariantOptionEditorValue(id: string): VariantOptionEditorValue {
  return {
    id,
    name: "",
    priceAmount: 0,
    available: true,
  };
}

export function createDefaultVariantCategoryEditorValues(
  optionId: string,
): VariantCategoryEditorValues {
  return {
    name: "",
    description: "",
    visible: true,
    options: [createVariantOptionEditorValue(optionId)],
    selectionMode: "optional-unlimited",
  };
}

export function mapVariantGroupToEditorValues(
  group: MenuVariantGroup,
): VariantCategoryEditorValues {
  const mode = deriveVariantSelectionMode(group.selection);

  return {
    name: group.name,
    description: group.description,
    visible: group.visibility === "visible",
    options: group.options.map((option) => ({
      id: option.id,
      name: option.name,
      priceAmount: option.priceAdjustment.amount,
      available: option.availability.status === "available",
    })),
    selectionMode: mode,
    selectionMinimum:
      mode === "exact" || mode === "minimum" || mode === "range"
        ? group.selection.minSelections
        : undefined,
    selectionMaximum:
      mode === "optional-maximum" || mode === "range"
        ? (group.selection.maxSelections ?? undefined)
        : undefined,
  };
}

export function createSelectionRuleFromEditorValues(
  values: Pick<
    VariantCategoryEditorValues,
    "selectionMode" | "selectionMinimum" | "selectionMaximum"
  >,
): VariantSelectionRule {
  return createVariantSelectionRule({
    mode: values.selectionMode,
    minimum: values.selectionMinimum,
    maximum: values.selectionMaximum,
  });
}

export function createSelectionFieldsForMode(
  mode: VariantSelectionMode,
  totalVariants: number,
): VariantSelectionEditorFields {
  if (mode === "optional-unlimited") return {};
  if (mode === "optional-maximum") return { selectionMaximum: totalVariants > 0 ? 1 : undefined };
  if (mode === "exact" || mode === "minimum") {
    return { selectionMinimum: totalVariants > 0 ? 1 : undefined };
  }

  return {
    selectionMinimum: totalVariants > 0 ? 1 : undefined,
    selectionMaximum: totalVariants > 0 ? totalVariants : undefined,
  };
}

export function normalizeVariantSelectionEditorFields(
  values: Pick<
    VariantCategoryEditorValues,
    "selectionMode" | "selectionMinimum" | "selectionMaximum"
  >,
  totalVariants: number,
): VariantSelectionEditorFields {
  if (totalVariants < 1) return {};

  try {
    const rule = normalizeVariantSelectionRule(
      createSelectionRuleFromEditorValues(values),
      totalVariants,
    );

    return {
      selectionMinimum:
        values.selectionMode === "exact" ||
        values.selectionMode === "minimum" ||
        values.selectionMode === "range"
          ? rule.minSelections
          : undefined,
      selectionMaximum:
        values.selectionMode === "optional-maximum"
          ? (rule.maxSelections ?? undefined)
          : values.selectionMode === "range"
            ? (rule.maxSelections ?? rule.minSelections)
            : undefined,
    };
  } catch {
    return createSelectionFieldsForMode(values.selectionMode, totalVariants);
  }
}

export function isVariantSelectionEditorValid(values: VariantCategoryEditorValues): boolean {
  if (values.options.length < 1) return false;

  try {
    const rule = createSelectionRuleFromEditorValues(values);
    const availableVariants = values.options.filter((option) => option.available).length;
    return validateVariantSelectionRule(rule, values.options.length, availableVariants).valid;
  } catch {
    return false;
  }
}

function toVariantOption(
  value: VariantOptionEditorValue,
  index: number,
  baseline: MenuVariantGroup | null,
): MenuVariantOption {
  const existing = baseline?.options.find((option) => option.id === value.id);

  return {
    id: value.id,
    name: value.name.trim(),
    priceAdjustment: {
      amount: value.priceAmount,
      currency: "IDR",
    },
    availability: value.available
      ? { status: "available" }
      : { status: "unavailable", unavailableUntil: null },
    inventory: existing?.inventory ?? { mode: "untracked" },
    sortOrder: index,
  };
}

export function createVariantCategoryEditorInput(
  values: VariantCategoryEditorValues,
  baseline: MenuVariantGroup | null,
  sortOrder: number,
): VariantCategoryEditorInput {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    visibility: values.visible ? "visible" : "hidden",
    selection: createSelectionRuleFromEditorValues(values),
    options: values.options.map((option, index) => toVariantOption(option, index, baseline)),
    sortOrder,
  };
}
