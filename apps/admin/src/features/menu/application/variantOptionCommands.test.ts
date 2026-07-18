import type { MenuVariantGroup } from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import {
  removeVariantOption,
  updateVariantOption,
  validateVariantOptionQuickEdit,
} from "./variantOptionCommands";

const group: MenuVariantGroup = {
  id: "group-1",
  name: "Extra",
  description: "",
  visibility: "visible",
  selection: { minSelections: 0, maxSelections: null },
  options: [
    {
      id: "option-1",
      name: "Telur",
      priceAdjustment: { amount: 4_000, currency: "IDR" },
      availability: { status: "available" },
      inventory: { mode: "untracked" },
      sortOrder: 0,
    },
    {
      id: "option-2",
      name: "Kerupuk",
      priceAdjustment: { amount: 2_000, currency: "IDR" },
      availability: { status: "available" },
      inventory: { mode: "untracked" },
      sortOrder: 1,
    },
  ],
  sortOrder: 0,
};

describe("variant option commands", () => {
  it("updates only the selected option without mutating the group", () => {
    const options = updateVariantOption(group, "option-1", {
      name: "Telur Rebus",
      priceAdjustment: { amount: 5_000, currency: "IDR" },
    });

    expect(options[0]).toMatchObject({ name: "Telur Rebus", priceAdjustment: { amount: 5_000 } });
    expect(options[1]).toBe(group.options[1]);
    expect(group.options[0]?.name).toBe("Telur");
  });

  it("removes only the selected option", () => {
    expect(removeVariantOption(group, "option-1").map((option) => option.id)).toEqual(["option-2"]);
  });

  it("accepts a trimmed name and non-negative integer price", () => {
    expect(validateVariantOptionQuickEdit({ name: " Telur ", priceAmount: 0 })).toBe(true);
    expect(validateVariantOptionQuickEdit({ name: " ", priceAmount: 1_000 })).toBe(false);
    expect(validateVariantOptionQuickEdit({ name: "Telur", priceAmount: -1 })).toBe(false);
  });
});
