import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuVariantGroup } from "@warungmeng/domain";
import { useEffect, useMemo, useState } from "react";
import {
  countVariantOptionsByAvailability,
  createVariantGroupCounts,
  DEFAULT_VARIANT_GROUP_LIST_FILTERS,
  filterVariantOptions,
  type VariantGroupAvailabilityFilter,
  type VariantGroupListFilters,
} from "./variantGroupListModel";
import {
  removeVariantOption,
  updateVariantOption,
  type VariantOptionQuickEdit,
} from "./variantOptionCommands";

export type VariantGroupListError = "load" | "update" | null;

export function useVariantGroupList(repository: MenuCatalogRepository) {
  const [groups, setGroups] = useState<readonly MenuVariantGroup[]>([]);
  const [filters, setFilters] = useState<VariantGroupListFilters>(
    DEFAULT_VARIANT_GROUP_LIST_FILTERS,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<VariantGroupListError>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [pendingOptionIds, setPendingOptionIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    void repository
      .listVariantGroups()
      .then((nextGroups) => {
        if (cancelled) return;
        setGroups(nextGroups);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadVersion, repository]);

  const filteredOptions = useMemo(() => filterVariantOptions(groups, filters), [filters, groups]);
  const groupCounts = useMemo(() => createVariantGroupCounts(groups, filters), [filters, groups]);
  const allCount = useMemo(
    () => countVariantOptionsByAvailability(groups, filters, "all"),
    [filters, groups],
  );
  const unavailableCount = useMemo(
    () => countVariantOptionsByAvailability(groups, filters, "unavailable"),
    [filters, groups],
  );

  function updateFilters(patch: Partial<VariantGroupListFilters>): void {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function retry(): void {
    setLoading(true);
    setError(null);
    setReloadVersion((current) => current + 1);
  }

  async function mutateVariantOption(
    groupId: string,
    optionId: string,
    mutate: (group: MenuVariantGroup) => readonly MenuVariantGroup["options"][number][],
  ): Promise<boolean> {
    setPendingOptionIds((current) => new Set(current).add(optionId));
    setError(null);

    try {
      const group = await repository.getVariantGroupById(groupId);
      if (!group) throw new Error(`Variant group ${groupId} was not found`);

      const updated = await repository.updateVariantGroup(groupId, {
        options: mutate(group),
      });
      if (!updated) throw new Error(`Variant group ${groupId} was not found`);

      setGroups((current) => current.map((item) => (item.id === groupId ? updated : item)));
      return true;
    } catch {
      setError("update");
      return false;
    } finally {
      setPendingOptionIds((current) => {
        const next = new Set(current);
        next.delete(optionId);
        return next;
      });
    }
  }

  function saveVariantOption(
    groupId: string,
    optionId: string,
    input: VariantOptionQuickEdit,
  ): Promise<boolean> {
    return mutateVariantOption(groupId, optionId, (group) =>
      updateVariantOption(group, optionId, {
        name: input.name.trim(),
        priceAdjustment: {
          amount: input.priceAmount,
          currency: "IDR",
        },
      }),
    );
  }

  function setVariantOptionAvailability(
    groupId: string,
    optionId: string,
    available: boolean,
  ): Promise<boolean> {
    return mutateVariantOption(groupId, optionId, (group) =>
      updateVariantOption(group, optionId, {
        availability: available
          ? { status: "available" }
          : { status: "unavailable", unavailableUntil: null },
      }),
    );
  }

  function deleteVariantOption(groupId: string, optionId: string): Promise<boolean> {
    return mutateVariantOption(groupId, optionId, (group) => removeVariantOption(group, optionId));
  }

  return {
    allCount,
    error,
    filteredOptions,
    filters,
    groupCounts,
    groups,
    loading,
    pendingOptionIds,
    retry,
    deleteVariantOption,
    saveVariantOption,
    setAvailability: (availability: VariantGroupAvailabilityFilter) =>
      updateFilters({ availability }),
    setGroup: (groupId: string | null) => updateFilters({ groupId }),
    setVariantOptionAvailability,
    setSearch: (search: string) => updateFilters({ search }),
    unavailableCount,
  };
}
