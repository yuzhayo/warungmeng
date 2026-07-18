import { describe, expect, it } from "vitest";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "./types";
import {
  isMenuAvailable,
  validateMenuCategory,
  validateMenuItem,
  validateMenuVariantGroup,
} from "./validation";

function createMenu(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "menu-1",
    name: "Gado-gado",
    slug: "gado-gado",
    categoryId: "category-food",
    description: "Sayuran dengan saus kacang",
    image: null,
    price: { amount: 22_000, currency: "IDR" },
    compareAtPrice: null,
    availability: { status: "available" },
    inventory: { mode: "untracked" },
    visibility: "visible",
    salesSchedule: { mode: "always" },
    variantGroupIds: [],
    sortOrder: 0,
    ...overrides,
  };
}

function createVariantGroup(overrides: Partial<MenuVariantGroup> = {}): MenuVariantGroup {
  return {
    id: "variant-temperature",
    name: "Suhu",
    description: "",
    visibility: "visible",
    selection: { minSelections: 1, maxSelections: 1 },
    options: [
      {
        id: "hot",
        name: "Panas",
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

describe("catalog validation", () => {
  it("accepts valid category, menu, and variant group entities", () => {
    const category: MenuCategory = {
      id: "category-food",
      name: "Makanan",
      slug: "makanan",
      visibility: "visible",
      sortOrder: 0,
    };

    expect(validateMenuCategory(category)).toEqual([]);
    expect(validateMenuItem(createMenu())).toEqual([]);
    expect(validateMenuVariantGroup(createVariantGroup())).toEqual([]);
  });

  it("rejects invalid money, compare price, and tracked inventory", () => {
    const issues = validateMenuItem(
      createMenu({
        price: { amount: -1, currency: "IDR" },
        compareAtPrice: { amount: -2, currency: "IDR" },
        inventory: { mode: "tracked", quantity: -1 },
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        { path: "price", code: "invalid_money" },
        { path: "compareAtPrice", code: "invalid_money" },
        { path: "compareAtPrice.amount", code: "invalid_range" },
        { path: "inventory.quantity", code: "invalid_integer" },
      ]),
    );
  });

  it("rejects malformed, duplicate, and overlapping scheduled intervals", () => {
    const issues = validateMenuItem(
      createMenu({
        salesSchedule: {
          mode: "scheduled",
          activeDays: ["mon", "mon"],
          allDay: false,
          intervals: [
            { id: "morning", start: "09:00", end: "12:00" },
            { id: "morning", start: "11:00", end: "13:00" },
            { id: "broken", start: "25:00", end: "08:00" },
          ],
        },
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        { path: "salesSchedule.activeDays.1", code: "duplicate" },
        { path: "salesSchedule.intervals.id.1", code: "duplicate" },
        { path: "salesSchedule.intervals.1", code: "overlap" },
        { path: "salesSchedule.intervals.2.start", code: "invalid_time" },
      ]),
    );
  });

  it("rejects invalid variant selection rules and duplicate option IDs", () => {
    const baseOption = createVariantGroup().options[0];
    if (!baseOption) throw new Error("Test fixture requires one option");

    const issues = validateMenuVariantGroup(
      createVariantGroup({
        selection: { minSelections: 2, maxSelections: 3 },
        options: [baseOption, { ...baseOption, name: "Dingin" }],
      }),
    );

    expect(issues).toEqual(
      expect.arrayContaining([
        { path: "selection.maxSelections", code: "invalid_range" },
        { path: "options.id.1", code: "duplicate" },
      ]),
    );
  });
});

describe("isMenuAvailable", () => {
  const now = new Date("2026-07-18T12:00:00.000Z");

  it("handles inventory and temporary availability independently of visibility", () => {
    expect(isMenuAvailable(createMenu({ visibility: "hidden" }), now)).toBe(true);
    expect(isMenuAvailable(createMenu({ inventory: { mode: "tracked", quantity: 0 } }), now)).toBe(
      false,
    );
    expect(
      isMenuAvailable(
        createMenu({
          availability: {
            status: "unavailable",
            unavailableUntil: "2026-07-18T11:00:00.000Z",
          },
        }),
        now,
      ),
    ).toBe(true);
    expect(
      isMenuAvailable(
        createMenu({
          availability: {
            status: "unavailable",
            unavailableUntil: "2026-07-18T13:00:00.000Z",
          },
        }),
        now,
      ),
    ).toBe(false);
  });
});
