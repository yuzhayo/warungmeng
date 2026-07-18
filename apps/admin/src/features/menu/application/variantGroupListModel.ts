import type { MenuVariantGroup, MenuVariantOption } from "@warungmeng/domain";

export type VariantGroupAvailabilityFilter = "all" | "unavailable";

export interface VariantGroupListFilters {
  readonly search: string;
  readonly groupId: string | null;
  readonly availability: VariantGroupAvailabilityFilter;
}

export interface VariantOptionListItem {
  readonly id: string;
  readonly groupId: string;
  readonly groupName: string;
  readonly option: MenuVariantOption;
}

export const DEFAULT_VARIANT_GROUP_LIST_FILTERS: VariantGroupListFilters = {
  search: "",
  groupId: null,
  availability: "all",
};

export function flattenVariantOptions(
  groups: readonly MenuVariantGroup[],
): readonly VariantOptionListItem[] {
  return groups.flatMap((group) =>
    group.options.map((option) => ({
      groupId: group.id,
      groupName: group.name,
      id: `${group.id}:${option.id}`,
      option,
    })),
  );
}

export function filterVariantOptions(
  groups: readonly MenuVariantGroup[],
  filters: VariantGroupListFilters,
): readonly VariantOptionListItem[] {
  const search = filters.search.trim().toLocaleLowerCase();

  return flattenVariantOptions(groups).filter((item) => {
    const matchesSearch =
      !search ||
      item.groupName.toLocaleLowerCase().includes(search) ||
      item.option.name.toLocaleLowerCase().includes(search);
    const matchesGroup = !filters.groupId || item.groupId === filters.groupId;
    const matchesAvailability =
      filters.availability === "all" || item.option.availability.status === "unavailable";

    return matchesSearch && matchesGroup && matchesAvailability;
  });
}

export function createVariantGroupCounts(
  groups: readonly MenuVariantGroup[],
  filters: VariantGroupListFilters,
): ReadonlyMap<string, number> {
  const relevantOptions = filterVariantOptions(groups, { ...filters, groupId: null });
  const counts = new Map<string, number>();

  relevantOptions.forEach((item) => {
    counts.set(item.groupId, (counts.get(item.groupId) ?? 0) + 1);
  });

  return counts;
}

export function countVariantOptionsByAvailability(
  groups: readonly MenuVariantGroup[],
  filters: VariantGroupListFilters,
  availability: VariantGroupAvailabilityFilter,
): number {
  return filterVariantOptions(groups, { ...filters, availability }).length;
}
