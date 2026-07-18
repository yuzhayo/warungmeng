import type { MenuVariantGroup } from "@warungmeng/domain";

export type VariantGroupAvailabilityFilter = "all" | "unavailable";

export interface VariantGroupListFilters {
  readonly search: string;
  readonly availability: VariantGroupAvailabilityFilter;
}

export const DEFAULT_VARIANT_GROUP_LIST_FILTERS: VariantGroupListFilters = {
  search: "",
  availability: "all",
};

export function hasUnavailableOption(group: MenuVariantGroup): boolean {
  return group.options.some((option) => option.availability.status === "unavailable");
}

export function filterVariantGroups(
  groups: readonly MenuVariantGroup[],
  filters: VariantGroupListFilters,
): readonly MenuVariantGroup[] {
  const search = filters.search.trim().toLocaleLowerCase();

  return groups.filter((group) => {
    const matchesSearch =
      !search ||
      group.name.toLocaleLowerCase().includes(search) ||
      group.description.toLocaleLowerCase().includes(search) ||
      group.options.some((option) => option.name.toLocaleLowerCase().includes(search));
    const matchesAvailability = filters.availability === "all" || hasUnavailableOption(group);

    return matchesSearch && matchesAvailability;
  });
}

export function countVariantGroupsByAvailability(
  groups: readonly MenuVariantGroup[],
  filters: VariantGroupListFilters,
  availability: VariantGroupAvailabilityFilter,
): number {
  return filterVariantGroups(groups, { ...filters, availability }).length;
}
