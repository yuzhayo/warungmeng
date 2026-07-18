import { createWarungMengMockSeed } from "@warungmeng/data";
import { describe, expect, it } from "vitest";
import {
  countVariantOptionsByAvailability,
  createVariantGroupCounts,
  DEFAULT_VARIANT_GROUP_LIST_FILTERS,
  filterVariantOptions,
  flattenVariantOptions,
} from "./variantGroupListModel";

const variantGroups = createWarungMengMockSeed().variantGroups ?? [];

describe("variantGroupListModel", () => {
  it("flattens category options into stable list rows", () => {
    const rows = flattenVariantOptions(variantGroups);

    expect(rows).toHaveLength(30);
    expect(rows[0]).toMatchObject({
      groupName: "EXTRA",
      option: { name: "BUMBU 50ml" },
    });
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
  });

  it("filters options by search, parent category, and availability", () => {
    expect(
      filterVariantOptions(variantGroups, {
        ...DEFAULT_VARIANT_GROUP_LIST_FILTERS,
        search: "strawberry",
      }).map((row) => row.option.name),
    ).toContain("Strawberry");

    const portionGroup = variantGroups.find((group) => group.name === "PORSI");
    if (!portionGroup) throw new Error("PORSI fixture was not found");

    expect(
      filterVariantOptions(variantGroups, {
        ...DEFAULT_VARIANT_GROUP_LIST_FILTERS,
        groupId: portionGroup.id,
      }),
    ).toHaveLength(2);
    expect(
      filterVariantOptions(variantGroups, {
        ...DEFAULT_VARIANT_GROUP_LIST_FILTERS,
        availability: "unavailable",
      }),
    ).toHaveLength(1);
  });

  it("builds category counts from active search and availability filters", () => {
    const counts = createVariantGroupCounts(variantGroups, {
      ...DEFAULT_VARIANT_GROUP_LIST_FILTERS,
      search: "strawberry",
    });

    expect([...counts.values()]).toEqual([1]);
  });

  it("counts option availability while preserving the selected category", () => {
    const portionGroup = variantGroups.find((group) => group.name === "PORSI");
    if (!portionGroup) throw new Error("PORSI fixture was not found");

    expect(
      countVariantOptionsByAvailability(variantGroups, DEFAULT_VARIANT_GROUP_LIST_FILTERS, "all"),
    ).toBe(30);
    expect(
      countVariantOptionsByAvailability(
        variantGroups,
        { ...DEFAULT_VARIANT_GROUP_LIST_FILTERS, groupId: portionGroup.id },
        "unavailable",
      ),
    ).toBe(1);
  });
});
