import type { MenuCategory, MenuItem } from "@warungmeng/domain";
import { InMemoryMenuCatalogRepository } from "@warungmeng/data";
import { describe, expect, it } from "vitest";
import { deleteMenuCategoryIfUnused } from "./menuCategoryCommands";

const category: MenuCategory = {
  id: "food",
  name: "Makanan",
  slug: "makanan",
  visibility: "visible",
  sortOrder: 0,
};

function createMenu(categoryId: string): MenuItem {
  return {
    id: "gado",
    name: "Gado-gado",
    slug: "gado-gado",
    categoryId,
    description: "",
    image: null,
    price: { amount: 0, currency: "IDR" },
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds: [],
    sortOrder: 0,
  };
}

describe("menu category commands", () => {
  it("protects a category that is still used by menus", async () => {
    const repository = new InMemoryMenuCatalogRepository({
      categories: [category],
      menus: [createMenu(category.id)],
    });

    await expect(deleteMenuCategoryIfUnused(repository, category.id)).resolves.toEqual({
      status: "in-use",
      menuCount: 1,
    });
    await expect(repository.getCategoryById(category.id)).resolves.toEqual(category);
  });

  it("deletes an unused category", async () => {
    const repository = new InMemoryMenuCatalogRepository({ categories: [category] });

    await expect(deleteMenuCategoryIfUnused(repository, category.id)).resolves.toEqual({
      status: "deleted",
    });
    await expect(repository.getCategoryById(category.id)).resolves.toBeNull();
  });

  it("reports a missing category without throwing", async () => {
    const repository = new InMemoryMenuCatalogRepository();

    await expect(deleteMenuCategoryIfUnused(repository, "missing")).resolves.toEqual({
      status: "not-found",
    });
  });
});
