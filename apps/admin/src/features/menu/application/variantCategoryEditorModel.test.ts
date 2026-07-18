import type { MenuVariantGroup } from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import {
  createDefaultVariantCategoryEditorValues,
  createSelectionFieldsForMode,
  createVariantCategoryEditorInput,
  isVariantSelectionEditorValid,
  mapVariantGroupToEditorValues,
  normalizeVariantSelectionEditorFields,
} from "./variantCategoryEditorModel";

const group: MenuVariantGroup = {
  id: "portion",
  name: "PORSI",
  description: "Ukuran porsi",
  visibility: "visible",
  selection: { minSelections: 1, maxSelections: 2 },
  options: [
    {
      id: "regular",
      name: "REGULER",
      priceAdjustment: { amount: 0, currency: "IDR" },
      availability: { status: "available" },
      inventory: { mode: "tracked", quantity: 4 },
      sortOrder: 0,
    },
    {
      id: "promo",
      name: "PROMO",
      priceAdjustment: { amount: 2_000, currency: "IDR" },
      availability: { status: "unavailable", unavailableUntil: null },
      inventory: { mode: "untracked" },
      sortOrder: 1,
    },
  ],
  sortOrder: 3,
};

describe("variant category editor model", () => {
  it("creates a safe default with one editable option", () => {
    expect(createDefaultVariantCategoryEditorValues("draft-1")).toMatchObject({
      visible: true,
      selectionMode: "optional-unlimited",
      options: [{ id: "draft-1", priceAmount: 0, available: true }],
    });
  });

  it("maps an existing group without losing its selection mode", () => {
    expect(mapVariantGroupToEditorValues(group)).toMatchObject({
      name: "PORSI",
      selectionMode: "range",
      selectionMinimum: 1,
      selectionMaximum: 2,
      options: [
        { id: "regular", available: true },
        { id: "promo", available: false },
      ],
    });
  });

  it("creates defaults and clamps limits when option totals change", () => {
    expect(createSelectionFieldsForMode("range", 3)).toEqual({
      selectionMinimum: 1,
      selectionMaximum: 3,
    });
    expect(
      normalizeVariantSelectionEditorFields(
        {
          selectionMode: "range",
          selectionMinimum: 2,
          selectionMaximum: 3,
        },
        1,
      ),
    ).toEqual({
      selectionMinimum: 1,
      selectionMaximum: 1,
    });
  });

  it("validates configured rules against currently available options", () => {
    expect(
      isVariantSelectionEditorValid({
        ...mapVariantGroupToEditorValues(group),
        selectionMode: "exact",
        selectionMinimum: 2,
      }),
    ).toBe(false);
    expect(
      isVariantSelectionEditorValid({
        ...mapVariantGroupToEditorValues(group),
        selectionMode: "exact",
        selectionMinimum: 1,
      }),
    ).toBe(true);
  });

  it("builds repository input and preserves existing inventory policies", () => {
    const input = createVariantCategoryEditorInput(
      {
        ...mapVariantGroupToEditorValues(group),
        name: " Porsi Baru ",
        options: [
          {
            id: "regular",
            name: " Besar ",
            priceAmount: 5_000,
            available: true,
          },
        ],
        selectionMode: "exact",
        selectionMinimum: 1,
        selectionMaximum: undefined,
      },
      group,
      group.sortOrder,
    );

    expect(input).toMatchObject({
      name: "Porsi Baru",
      selection: { minSelections: 1, maxSelections: 1 },
      options: [
        {
          name: "Besar",
          inventory: { mode: "tracked", quantity: 4 },
          sortOrder: 0,
        },
      ],
    });
  });
});
