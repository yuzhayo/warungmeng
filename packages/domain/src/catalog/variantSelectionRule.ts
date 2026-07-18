import type { VariantSelectionRule } from "./types";

export type VariantSelectionMode =
  "optional-unlimited" | "optional-maximum" | "exact" | "minimum" | "range";

export interface CreateVariantSelectionRuleInput {
  readonly mode: VariantSelectionMode;
  readonly minimum?: number;
  readonly maximum?: number;
}

export type VariantSelectionValidationCode =
  | "invalid_total_variants"
  | "invalid_available_variants"
  | "available_exceeds_total"
  | "invalid_minimum"
  | "invalid_maximum"
  | "minimum_exceeds_maximum"
  | "minimum_exceeds_total"
  | "maximum_exceeds_total"
  | "minimum_exceeds_available";

export interface VariantSelectionValidationResult {
  readonly valid: boolean;
  readonly issues: readonly VariantSelectionValidationCode[];
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function requirePositiveInteger(value: number | undefined, field: string): number {
  if (value === undefined || !Number.isInteger(value) || value < 1) {
    throw new RangeError(`${field} must be a positive integer`);
  }

  return value;
}

function createIntegerOptions(start: number, end: number): number[] {
  if (start > end) return [];
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

export function deriveVariantSelectionMode(rule: VariantSelectionRule): VariantSelectionMode {
  if (rule.minSelections === 0) {
    return rule.maxSelections === null ? "optional-unlimited" : "optional-maximum";
  }

  if (rule.maxSelections === null) return "minimum";
  return rule.minSelections === rule.maxSelections ? "exact" : "range";
}

export function createVariantSelectionRule({
  mode,
  minimum,
  maximum,
}: CreateVariantSelectionRuleInput): VariantSelectionRule {
  if (mode === "optional-unlimited") {
    return { minSelections: 0, maxSelections: null };
  }

  if (mode === "optional-maximum") {
    return {
      minSelections: 0,
      maxSelections: requirePositiveInteger(maximum, "maximum"),
    };
  }

  const requiredMinimum = requirePositiveInteger(minimum, "minimum");

  if (mode === "minimum") {
    return { minSelections: requiredMinimum, maxSelections: null };
  }

  if (mode === "exact") {
    return { minSelections: requiredMinimum, maxSelections: requiredMinimum };
  }

  const requiredMaximum = requirePositiveInteger(maximum, "maximum");
  if (requiredMinimum > requiredMaximum) {
    throw new RangeError("minimum cannot exceed maximum");
  }

  return {
    minSelections: requiredMinimum,
    maxSelections: requiredMaximum,
  };
}

export function getVariantMinimumOptions(
  totalVariants: number,
  maximum: number | null = null,
): readonly number[] {
  if (!Number.isInteger(totalVariants) || totalVariants < 1) return [];
  if (maximum !== null && (!Number.isInteger(maximum) || maximum < 1)) return [];

  const upperBound = maximum === null ? totalVariants : Math.min(maximum, totalVariants);
  return createIntegerOptions(1, upperBound);
}

export function getVariantMaximumOptions(
  totalVariants: number,
  minimum: number | null = null,
): readonly number[] {
  if (!Number.isInteger(totalVariants) || totalVariants < 1) return [];
  if (minimum !== null && (!Number.isInteger(minimum) || minimum < 1)) return [];

  const lowerBound = minimum === null ? 1 : Math.min(minimum, totalVariants);
  return createIntegerOptions(lowerBound, totalVariants);
}

export function normalizeVariantSelectionRule(
  rule: VariantSelectionRule,
  totalVariants: number,
): VariantSelectionRule {
  if (!Number.isInteger(totalVariants) || totalVariants < 0) {
    throw new RangeError("totalVariants must be a non-negative integer");
  }

  if (
    totalVariants === 0 ||
    !isNonNegativeInteger(rule.minSelections) ||
    (rule.maxSelections !== null && !isNonNegativeInteger(rule.maxSelections))
  ) {
    return { ...rule };
  }

  const mode = deriveVariantSelectionMode(rule);
  if (mode === "optional-unlimited") return { minSelections: 0, maxSelections: null };

  if (mode === "optional-maximum") {
    return {
      minSelections: 0,
      maxSelections: Math.min(rule.maxSelections ?? totalVariants, totalVariants),
    };
  }

  const minimum = clamp(rule.minSelections, 1, totalVariants);
  if (mode === "minimum") {
    return { minSelections: minimum, maxSelections: null };
  }

  if (mode === "exact") {
    return { minSelections: minimum, maxSelections: minimum };
  }

  const maximum = clamp(rule.maxSelections ?? minimum, minimum, totalVariants);
  return { minSelections: minimum, maxSelections: maximum };
}

export function validateVariantSelectionRule(
  rule: VariantSelectionRule,
  totalVariants: number,
  availableVariants: number = totalVariants,
): VariantSelectionValidationResult {
  const issues: VariantSelectionValidationCode[] = [];
  const totalIsValid = isNonNegativeInteger(totalVariants);
  const availableIsValid = isNonNegativeInteger(availableVariants);
  const minimumIsValid = isNonNegativeInteger(rule.minSelections);
  const maximumIsValid = rule.maxSelections === null || isNonNegativeInteger(rule.maxSelections);

  if (!totalIsValid) issues.push("invalid_total_variants");
  if (!availableIsValid) issues.push("invalid_available_variants");
  if (!minimumIsValid) issues.push("invalid_minimum");
  if (!maximumIsValid) issues.push("invalid_maximum");

  if (totalIsValid && availableIsValid && availableVariants > totalVariants) {
    issues.push("available_exceeds_total");
  }

  if (
    minimumIsValid &&
    maximumIsValid &&
    rule.maxSelections !== null &&
    rule.minSelections > rule.maxSelections
  ) {
    issues.push("minimum_exceeds_maximum");
  }

  if (totalIsValid && minimumIsValid && rule.minSelections > totalVariants) {
    issues.push("minimum_exceeds_total");
  }

  if (
    totalIsValid &&
    maximumIsValid &&
    rule.maxSelections !== null &&
    rule.maxSelections > totalVariants
  ) {
    issues.push("maximum_exceeds_total");
  }

  if (availableIsValid && minimumIsValid && rule.minSelections > availableVariants) {
    issues.push("minimum_exceeds_available");
  }

  return { valid: issues.length === 0, issues };
}
