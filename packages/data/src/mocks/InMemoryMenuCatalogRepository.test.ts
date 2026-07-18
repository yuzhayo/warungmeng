import { describe, expect, it } from "vitest";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import { InMemoryMenuCatalogRepository } from "./InMemoryMenuCatalogRepository";

const foodCategory: MenuCategory = {
  id: "food",
  name: "Makanan",
  slug: "makanan",
  visibility: "visible",
  sortOrder: 0,
};

const drinkCategory: MenuCategory = {
  id: "drink",
  name: "Minuman",
  slug: "minuman",
  visibility: "visible",
  sortOrder: 1,
};

function createMenu(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "menu-gado",
    name: "Gado-gado",
    slug: "gado-gado",
    categoryId: "food",
    description: "Saus kacang",
    image: null,
    price: { amount: 22_000, currency: "IDR" },
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds: [],
    sortOrder: 1,
    ...overrides,
  };
}

function createVariantGroup(overrides: Partial<MenuVariantGroup> = {}): MenuVariantGroup {
  return {
    id: "spice",
    name: "Pedas",
    description: "",
    visibility: "visible",
    selection: { minSelections: 0, maxSelections: 1 },
    options: [
      {
        id: "medium",
        name: "Sedang",
        priceAdjustment: { amount: 0, currency: "IDR" },
        availability: { status: "available" },
        inventory: { mode: "untracked" },
        sortOrder: 0,
      },
    ],
    sortOrder: 0,
    ...overrides,
  };
}

function createRepository(): InMemoryMenuCatalogRepository {
  return new InMemoryMenuCatalogRepository({
    categories: [drinkCategory, foodCategory],
    menus: [
      createMenu(),
      createMenu({
        id: "menu-tea",
        name: "Es teh",
        slug: "es-teh",
        categoryId: "drink",
        description: "Teh dingin manis",
        availability: { status: "unavailable", unavailableUntil: null },
        sortOrder: 0,
      }),
    ],
    variantGroups: [createVariantGroup()],
  });
}

describe("InMemoryMenuCatalogRepository menus", () => {
  it("filters, searches, and sorts menu results", async () => {
    const repository = createRepository();

    await expect(repository.listMenus()).resolves.toMatchObject([
      { id: "menu-tea" },
      { id: "menu-gado" },
    ]);
    await expect(repository.listMenus({ search: "KACANG" })).resolves.toMatchObject([
      { id: "menu-gado" },
    ]);
    await expect(
      repository.listMenus({ categoryId: "drink", availability: "unavailable" }),
    ).resolves.toMatchObject([{ id: "menu-tea" }]);
  });

  it("returns defensive copies of stored entities", async () => {
    const repository = createRepository();
    const result = await repository.listMenus();
    const first = result[0];
    if (!first) throw new Error("Test fixture requires a menu");

    expect(first).not.toBe(createMenu());
    (first as { description: string }).description = "Changed outside repository";

    await expect(repository.getMenuById(first.id)).resolves.not.toMatchObject({
      description: "Changed outside repository",
    });
  });

  it("creates, updates, and deletes a menu with deterministic IDs", async () => {
    const repository = new InMemoryMenuCatalogRepository({}, (kind) => `${kind}-generated`);
    const { id: _ignored, ...input } = createMenu();

    const created = await repository.createMenu(input);
    expect(created.id).toBe("menu-generated");

    await expect(
      repository.updateMenu(created.id, { name: "Gado-gado spesial" }),
    ).resolves.toMatchObject({
      id: created.id,
      name: "Gado-gado spesial",
    });
    await expect(repository.updateMenu("missing", { name: "No-op" })).resolves.toBeNull();
    await expect(repository.deleteMenu(created.id)).resolves.toBe(true);
    await expect(repository.deleteMenu(created.id)).resolves.toBe(false);
  });
});

describe("InMemoryMenuCatalogRepository supporting entities", () => {
  it("supports category and variant-group CRUD without exposing mutable state", async () => {
    const repository = createRepository();

    await expect(repository.listCategories()).resolves.toMatchObject([
      { id: "food" },
      { id: "drink" },
    ]);
    await expect(repository.getVariantGroupById("spice")).resolves.toMatchObject({
      name: "Pedas",
    });
    await expect(repository.updateCategory("food", { name: "Menu utama" })).resolves.toMatchObject({
      name: "Menu utama",
    });
    await expect(repository.deleteVariantGroup("spice")).resolves.toBe(true);
    await expect(repository.getVariantGroupById("spice")).resolves.toBeNull();
  });
});
