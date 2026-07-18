import type { MenuItem, MenuVariantGroup, SalesInterval, Weekday } from "@warungmeng/domain";
import { validateMenuItem } from "@warungmeng/domain";

export type MenuEditorInventoryMode = "untracked" | "tracked";
export type MenuEditorSalesMode = "always" | "scheduled";

export interface MenuEditorValues {
  readonly name: string;
  readonly categoryId: string;
  readonly description: string;
  readonly imageUrl: string;
  readonly priceAmount: number;
  readonly available: boolean;
  readonly visible: boolean;
  readonly inventoryMode: MenuEditorInventoryMode;
  readonly stockQuantity: number;
  readonly salesMode: MenuEditorSalesMode;
  readonly activeDays: readonly Weekday[];
  readonly allDay: boolean;
  readonly intervals: readonly SalesInterval[];
  readonly variantGroupIds: readonly string[];
}

export type MenuEditorInput = Omit<MenuItem, "id">;

export const MENU_EDITOR_WEEKDAYS: readonly Weekday[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const MENU_EDITOR_MAX_INTERVALS = 3;

export function createDefaultMenuEditorValues(intervalId: string): MenuEditorValues {
  return {
    name: "",
    categoryId: "",
    description: "",
    imageUrl: "",
    priceAmount: 0,
    available: true,
    visible: true,
    inventoryMode: "untracked",
    stockQuantity: 0,
    salesMode: "always",
    activeDays: [...MENU_EDITOR_WEEKDAYS],
    allDay: true,
    intervals: [{ id: intervalId, start: "09:00", end: "21:00" }],
    variantGroupIds: [],
  };
}

export function mapMenuToEditorValues(menu: MenuItem): MenuEditorValues {
  const scheduled = menu.salesSchedule.mode === "scheduled" ? menu.salesSchedule : null;

  return {
    name: menu.name,
    categoryId: menu.categoryId,
    description: menu.description,
    imageUrl: menu.image?.url ?? "",
    priceAmount: menu.price.amount,
    available: menu.availability.status === "available",
    visible: menu.visibility === "visible",
    inventoryMode: menu.inventory.mode,
    stockQuantity: menu.inventory.mode === "tracked" ? menu.inventory.quantity : 0,
    salesMode: menu.salesSchedule.mode,
    activeDays: scheduled?.activeDays ?? [...MENU_EDITOR_WEEKDAYS],
    allDay: scheduled?.allDay ?? true,
    intervals: scheduled?.intervals.length
      ? scheduled.intervals.map((interval) => ({ ...interval }))
      : [{ id: "sales-interval-default", start: "09:00", end: "21:00" }],
    variantGroupIds: [...menu.variantGroupIds],
  };
}

export function slugifyMenuName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createMenuEditorInput(
  values: MenuEditorValues,
  baseline: MenuItem | null,
  sortOrder: number,
): MenuEditorInput {
  const name = values.name.trim();

  return {
    name,
    slug: baseline?.slug ?? slugifyMenuName(name),
    categoryId: values.categoryId,
    description: values.description.trim(),
    image: values.imageUrl.trim()
      ? {
          url: values.imageUrl.trim(),
          alt: name,
        }
      : null,
    price: {
      amount: values.priceAmount,
      currency: "IDR",
    },
    compareAtPrice: baseline?.compareAtPrice ?? null,
    availability: values.available
      ? { status: "available" }
      : { status: "unavailable", unavailableUntil: null },
    inventory:
      values.inventoryMode === "tracked"
        ? { mode: "tracked", quantity: values.stockQuantity }
        : { mode: "untracked" },
    visibility: values.visible ? "visible" : "hidden",
    salesSchedule:
      values.salesMode === "always"
        ? { mode: "always" }
        : {
            mode: "scheduled",
            activeDays: values.activeDays,
            allDay: values.allDay,
            intervals: values.allDay ? [] : values.intervals,
          },
    variantGroupIds: [...new Set(values.variantGroupIds)],
    sortOrder,
  };
}

export function validateMenuEditorValues(
  values: MenuEditorValues,
  baseline: MenuItem | null,
  sortOrder: number,
): ReturnType<typeof validateMenuItem> {
  return validateMenuItem({
    id: baseline?.id ?? "menu-editor-draft",
    ...createMenuEditorInput(values, baseline, sortOrder),
  });
}

export function getSelectableVariantGroups(
  groups: readonly MenuVariantGroup[],
): readonly MenuVariantGroup[] {
  return groups.filter((group) => group.visibility === "visible");
}
