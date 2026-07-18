import { createWarungMengMockSeed } from "@warungmeng/data";
import { describe, expect, it } from "vitest";
import {
  countVariantGroupsByAvailability,
  DEFAULT_VARIANT_GROUP_LIST_FILTERS,
  filterVariantGroups,
  hasUnavailableOption,
} from "./variantGroupListModel";

const variantGroups = createWarungMengMockSeed().variantGroups ?? [];

describe("variantGroupListModel", () => {
  it("searches group names, descriptions, and option names", () => {
    expect(
      filterVariantGroups(variantGroups, {
        ...DEFAULT_VARIANT_GROUP_LIST_FILTERS,
        search: "strawberry",
      }).map((group) => group.name),
    ).toEqual(["MIX"]);

    expect(
      filterVariantGroups(variantGroups, {
        ...DEFAULT_VARIANT_GROUP_LIST_FILTERS,
        search: "original buatan sendiri",
      }).map((group) => group.name),
    ).toEqual(["LONTONG BALAP"]);
  });

  it("identifies groups containing an unavailable option", () => {
    const portionGroup = variantGroups.find((group) => group.name === "PORSI");
    const iceGroup = variantGroups.find((group) => group.name === "Ice");

    expect(portionGroup && hasUnavailableOption(portionGroup)).toBe(true);
    expect(iceGroup && hasUnavailableOption(iceGroup)).toBe(false);
    expect(
      countVariantGroupsByAvailability(
        variantGroups,
        DEFAULT_VARIANT_GROUP_LIST_FILTERS,
        "unavailable",
      ),
    ).toBe(1);
  });
});
