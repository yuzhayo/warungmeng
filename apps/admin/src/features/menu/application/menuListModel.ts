import type { MenuAvailability, MenuItem } from "@warungmeng/domain";

export type MenuAvailabilityFilter = "all" | MenuAvailability["status"];

export interface MenuListFilters {
  readonly search: string;
  readonly categoryId: string | null;
  readonly availability: MenuAvailabilityFilter;
}

export const DEFAULT_MENU_LIST_FILTERS: MenuListFilters = {
  search: "",
  categoryId: null,
  availability: "all",
};

export function filterMenuItems(
  menus: readonly MenuItem[],
  filters: MenuListFilters,
): readonly MenuItem[] {
  const search = filters.search.trim().toLocaleLowerCase();

  return menus.filter((menu) => {
    const matchesSearch =
      !search ||
      menu.name.toLocaleLowerCase().includes(search) ||
      menu.description.toLocaleLowerCase().includes(search);
    const matchesCategory = !filters.categoryId || menu.categoryId === filters.categoryId;
    const matchesAvailability =
      filters.availability === "all" || menu.availability.status === filters.availability;

    return matchesSearch && matchesCategory && matchesAvailability;
  });
}

export function createCategoryCounts(
  menus: readonly MenuItem[],
  filters: MenuListFilters,
): ReadonlyMap<string, number> {
  const relevantMenus = filterMenuItems(menus, { ...filters, categoryId: null });
  const counts = new Map<string, number>();

  relevantMenus.forEach((menu) => {
    counts.set(menu.categoryId, (counts.get(menu.categoryId) ?? 0) + 1);
  });

  return counts;
}

export function countMenusByAvailability(
  menus: readonly MenuItem[],
  filters: MenuListFilters,
  availability: MenuAvailabilityFilter,
): number {
  return filterMenuItems(menus, { ...filters, availability }).length;
}
