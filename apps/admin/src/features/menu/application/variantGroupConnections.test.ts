import type { MenuItem } from "@warungmeng/domain";
import { InMemoryMenuCatalogRepository } from "@warungmeng/data";
import { describe, expect, it } from "vitest";
import {
  createVariantGroupConnectionChanges,
  getConnectedMenuIds,
  syncVariantGroupConnections,
} from "./variantGroupConnections";

function createMenu(id: string, variantGroupIds: readonly string[] = []): MenuItem {
  return {
    id,
    name: id,
    slug: id,
    categoryId: "food",
    description: "",
    image: null,
    price: { amount: 0, currency: "IDR" },
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds,
    sortOrder: 0,
  };
}

describe("variant group connections", () => {
  const menus = [
    createMenu("menu-a", ["size", "spice"]),
    createMenu("menu-b", ["spice"]),
    createMenu("menu-c"),
  ];

  it("derives connected menu IDs from menu ownership", () => {
    expect(getConnectedMenuIds(menus, "size")).toEqual(["menu-a"]);
  });

  it("creates only the required add and remove patches", () => {
    expect(createVariantGroupConnectionChanges(menus, "size", ["menu-b"])).toEqual([
      { menuId: "menu-a", variantGroupIds: ["spice"] },
      { menuId: "menu-b", variantGroupIds: ["spice", "size"] },
    ]);
  });

  it("does not create duplicate IDs or no-op patches", () => {
    expect(createVariantGroupConnectionChanges(menus, "size", ["menu-a"])).toEqual([]);
  });

  it("persists connection changes through the repository contract", async () => {
    const repository = new InMemoryMenuCatalogRepository({ menus });

    await syncVariantGroupConnections(repository, menus, "size", ["menu-c"]);

    await expect(repository.getMenuById("menu-a")).resolves.toMatchObject({
      variantGroupIds: ["spice"],
    });
    await expect(repository.getMenuById("menu-c")).resolves.toMatchObject({
      variantGroupIds: ["size"],
    });
  });
});
