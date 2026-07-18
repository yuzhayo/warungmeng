import type { MenuItem } from "@warungmeng/domain";
import { describe, expect, it } from "vitest";
import {
  createDefaultMenuEditorValues,
  createMenuEditorInput,
  mapMenuToEditorValues,
  slugifyMenuName,
  validateMenuEditorValues,
} from "./menuEditorModel";

const menu: MenuItem = {
  id: "gado",
  name: "Gado-gado",
  slug: "gado-gado",
  categoryId: "food",
  description: "Saus kacang",
  image: { url: "/gado.jpg", alt: "Gado-gado" },
  price: { amount: 22_000, currency: "IDR" },
  compareAtPrice: null,
  availability: { status: "available" },
  inventory: { mode: "tracked", quantity: 5 },
  visibility: "visible",
  salesSchedule: { mode: "always" },
  variantGroupIds: ["portion"],
  sortOrder: 2,
};

describe("menu editor model", () => {
  it("creates safe defaults and maps existing menus", () => {
    expect(createDefaultMenuEditorValues("interval-1")).toMatchObject({
      priceAmount: 0,
      available: true,
      inventoryMode: "untracked",
      salesMode: "always",
      intervals: [{ id: "interval-1" }],
    });
    expect(mapMenuToEditorValues(menu)).toMatchObject({
      name: "Gado-gado",
      stockQuantity: 5,
      variantGroupIds: ["portion"],
    });
  });

  it("creates stable slugs for new menu names", () => {
    expect(slugifyMenuName("  Es Télér Creamy  ")).toBe("es-teler-creamy");
  });

  it("builds repository input while preserving edit-only data", () => {
    expect(
      createMenuEditorInput(
        {
          ...mapMenuToEditorValues(menu),
          name: " Gado Spesial ",
          inventoryMode: "untracked",
          variantGroupIds: ["portion", "portion"],
        },
        menu,
        menu.sortOrder,
      ),
    ).toMatchObject({
      name: "Gado Spesial",
      slug: "gado-gado",
      inventory: { mode: "untracked" },
      variantGroupIds: ["portion"],
    });
  });

  it("uses the domain validator as the single validation source", () => {
    const valid = mapMenuToEditorValues(menu);
    expect(validateMenuEditorValues(valid, menu, menu.sortOrder)).toEqual([]);

    const invalid = {
      ...valid,
      name: "",
      inventoryMode: "tracked" as const,
      stockQuantity: -1,
    };
    expect(validateMenuEditorValues(invalid, menu, menu.sortOrder)).toEqual(
      expect.arrayContaining([
        { path: "name", code: "required" },
        { path: "inventory.quantity", code: "invalid_integer" },
      ]),
    );
  });
});
