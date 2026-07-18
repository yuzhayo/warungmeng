import { describe, expect, it } from "vitest";
import {
  validateMenuCategory,
  validateMenuItem,
  validateMenuVariantGroup,
} from "@warungmeng/domain";
import { createWarungMengMockRepository, createWarungMengMockSeed } from "./WarungMengMockData";

describe("Warung Meng real-data mock seed", () => {
  it("maps all exported records into valid domain entities", () => {
    const seed = createWarungMengMockSeed();

    expect(seed.categories).toHaveLength(2);
    expect(seed.menus).toHaveLength(23);
    expect(seed.variantGroups).toHaveLength(9);
    expect(seed.variantGroups?.flatMap((group) => group.options)).toHaveLength(30);

    expect(seed.categories?.flatMap(validateMenuCategory)).toEqual([]);
    expect(seed.menus?.flatMap(validateMenuItem)).toEqual([]);
    expect(seed.variantGroups?.flatMap(validateMenuVariantGroup)).toEqual([]);
  });

  it("preserves real IDs and every menu-to-variant relation", () => {
    const seed = createWarungMengMockSeed();
    const variantIds = new Set(seed.variantGroups?.map((group) => group.id));

    expect(
      seed.menus?.every(
        (menu) =>
          !menu.id.includes('="') &&
          menu.variantGroupIds.every((variantId) => variantIds.has(variantId)),
      ),
    ).toBe(true);
  });

  it("maps representative menu stock, status, and duplicate-name slugs", () => {
    const seed = createWarungMengMockSeed();
    const gadoGado = seed.menus?.find((menu) => menu.id === "2661748529823232");
    const lontongKikil = seed.menus?.filter((menu) => menu.name === "LONTONG KIKIL");

    expect(gadoGado).toMatchObject({
      categoryId: "2661748425980928",
      price: { amount: 22_000, currency: "IDR" },
      inventory: { mode: "tracked", quantity: 5 },
      availability: { status: "available" },
      visibility: "visible",
      variantGroupIds: ["3106667766346240", "3106671583541248", "3106700562020352"],
    });
    expect(new Set(lontongKikil?.map((menu) => menu.slug)).size).toBe(2);
    expect(lontongKikil?.some((menu) => menu.visibility === "hidden")).toBe(true);
  });

  it("maps each exported variant selection rule", () => {
    const seed = createWarungMengMockSeed();
    const groupsByName = new Map(seed.variantGroups?.map((group) => [group.name, group]));

    expect(groupsByName.get("EXTRA")?.selection).toEqual({
      minSelections: 0,
      maxSelections: null,
    });
    expect(groupsByName.get("PORSI")?.selection).toEqual({
      minSelections: 1,
      maxSelections: 1,
    });
    expect(groupsByName.get("MIX")?.selection).toEqual({
      minSelections: 2,
      maxSelections: null,
    });
    expect(groupsByName.get("Ice")?.selection).toEqual({
      minSelections: 0,
      maxSelections: 1,
    });
  });

  it("creates a repository ready for admin and storefront consumers", async () => {
    const repository = createWarungMengMockRepository();

    await expect(repository.listCategories()).resolves.toHaveLength(2);
    await expect(
      repository.listMenus({ categoryId: "2661748425980929", visibility: "visible" }),
    ).resolves.toHaveLength(7);
    await expect(repository.listVariantGroups()).resolves.toHaveLength(9);
  });
});
