import { describe, expect, it } from "vitest";
import {
  createVariantSelectionRule,
  deriveVariantSelectionMode,
  getVariantMaximumOptions,
  getVariantMinimumOptions,
  normalizeVariantSelectionRule,
  validateVariantSelectionRule,
} from "./variantSelectionRule";

describe("variant selection rule modes", () => {
  it.each([
    [{ minSelections: 0, maxSelections: null }, "optional-unlimited"],
    [{ minSelections: 0, maxSelections: 2 }, "optional-maximum"],
    [{ minSelections: 2, maxSelections: 2 }, "exact"],
    [{ minSelections: 2, maxSelections: null }, "minimum"],
    [{ minSelections: 1, maxSelections: 3 }, "range"],
  ] as const)("derives %s as %s", (rule, mode) => {
    expect(deriveVariantSelectionMode(rule)).toBe(mode);
  });

  it("creates every supported rule without UI-specific state", () => {
    expect(createVariantSelectionRule({ mode: "optional-unlimited" })).toEqual({
      minSelections: 0,
      maxSelections: null,
    });
    expect(createVariantSelectionRule({ mode: "optional-maximum", maximum: 2 })).toEqual({
      minSelections: 0,
      maxSelections: 2,
    });
    expect(createVariantSelectionRule({ mode: "exact", minimum: 2 })).toEqual({
      minSelections: 2,
      maxSelections: 2,
    });
    expect(createVariantSelectionRule({ mode: "minimum", minimum: 2 })).toEqual({
      minSelections: 2,
      maxSelections: null,
    });
    expect(createVariantSelectionRule({ mode: "range", minimum: 1, maximum: 3 })).toEqual({
      minSelections: 1,
      maxSelections: 3,
    });
  });

  it("rejects incomplete or reversed required selections", () => {
    expect(() => createVariantSelectionRule({ mode: "exact" })).toThrow(RangeError);
    expect(() => createVariantSelectionRule({ mode: "range", minimum: 3, maximum: 2 })).toThrow(
      RangeError,
    );
  });
});

describe("variant selection dropdown options", () => {
  it("limits minimum choices to the selected maximum", () => {
    expect(getVariantMinimumOptions(3, 2)).toEqual([1, 2]);
  });

  it("limits maximum choices to the selected minimum", () => {
    expect(getVariantMaximumOptions(3, 2)).toEqual([2, 3]);
  });

  it("uses configured variant total and handles an empty group", () => {
    expect(getVariantMinimumOptions(3)).toEqual([1, 2, 3]);
    expect(getVariantMaximumOptions(3)).toEqual([1, 2, 3]);
    expect(getVariantMinimumOptions(0)).toEqual([]);
    expect(getVariantMaximumOptions(0)).toEqual([]);
  });
});

describe("variant selection normalization", () => {
  it("clamps an exact rule when configured variants are removed", () => {
    expect(normalizeVariantSelectionRule({ minSelections: 2, maxSelections: 2 }, 1)).toEqual({
      minSelections: 1,
      maxSelections: 1,
    });
  });

  it("preserves the rule mode while clamping its limits", () => {
    expect(normalizeVariantSelectionRule({ minSelections: 0, maxSelections: 3 }, 2)).toEqual({
      minSelections: 0,
      maxSelections: 2,
    });
    expect(normalizeVariantSelectionRule({ minSelections: 2, maxSelections: null }, 1)).toEqual({
      minSelections: 1,
      maxSelections: null,
    });
    expect(normalizeVariantSelectionRule({ minSelections: 2, maxSelections: 3 }, 1)).toEqual({
      minSelections: 1,
      maxSelections: 1,
    });
  });

  it("does not mutate the source and preserves required rules for an empty group", () => {
    const source = { minSelections: 2, maxSelections: 2 };
    const normalized = normalizeVariantSelectionRule(source, 0);

    expect(normalized).toEqual(source);
    expect(normalized).not.toBe(source);
  });
});

describe("variant selection validation", () => {
  it("accepts choosing exactly two of three configured variants", () => {
    expect(validateVariantSelectionRule({ minSelections: 2, maxSelections: 2 }, 3, 3)).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("keeps configured and currently available counts independent", () => {
    expect(validateVariantSelectionRule({ minSelections: 2, maxSelections: 3 }, 3, 2)).toEqual({
      valid: true,
      issues: [],
    });

    expect(validateVariantSelectionRule({ minSelections: 2, maxSelections: 3 }, 3, 1)).toEqual({
      valid: false,
      issues: ["minimum_exceeds_available"],
    });
  });

  it("reports reversed and out-of-range limits", () => {
    expect(
      validateVariantSelectionRule({ minSelections: 3, maxSelections: 2 }, 2, 2).issues,
    ).toEqual(
      expect.arrayContaining([
        "minimum_exceeds_maximum",
        "minimum_exceeds_total",
        "minimum_exceeds_available",
      ]),
    );

    expect(
      validateVariantSelectionRule({ minSelections: 0, maxSelections: 4 }, 3).issues,
    ).toContain("maximum_exceeds_total");
  });

  it("reports invalid configured and available counts", () => {
    expect(
      validateVariantSelectionRule({ minSelections: -1, maxSelections: 1.5 }, -1, 4).issues,
    ).toEqual(
      expect.arrayContaining(["invalid_total_variants", "invalid_minimum", "invalid_maximum"]),
    );

    expect(
      validateVariantSelectionRule({ minSelections: 0, maxSelections: null }, 3, 4).issues,
    ).toContain("available_exceeds_total");
  });
});
