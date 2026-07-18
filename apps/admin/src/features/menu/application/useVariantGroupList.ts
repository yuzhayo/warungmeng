import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import { useEffect, useMemo, useState } from "react";
import {
  countVariantGroupsByAvailability,
  DEFAULT_VARIANT_GROUP_LIST_FILTERS,
  filterVariantGroups,
  type VariantGroupAvailabilityFilter,
  type VariantGroupListFilters,
} from "./variantGroupListModel";

export type VariantGroupListError = "load" | "update" | null;

function createConnectedMenuCounts(menus: readonly MenuItem[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  menus.forEach((menu) => {
    menu.variantGroupIds.forEach((groupId) => {
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    });
  });

  return counts;
}

export function useVariantGroupList(repository: MenuCatalogRepository) {
  const [groups, setGroups] = useState<readonly MenuVariantGroup[]>([]);
  const [menus, setMenus] = useState<readonly MenuItem[]>([]);
  const [filters, setFilters] = useState<VariantGroupListFilters>(
    DEFAULT_VARIANT_GROUP_LIST_FILTERS,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<VariantGroupListError>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [pendingGroupIds, setPendingGroupIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    void Promise.all([repository.listVariantGroups(), repository.listMenus()])
      .then(([nextGroups, nextMenus]) => {
        if (cancelled) return;
        setGroups(nextGroups);
        setMenus(nextMenus);
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

  const filteredGroups = useMemo(() => filterVariantGroups(groups, filters), [filters, groups]);
  const connectedMenuCounts = useMemo(() => createConnectedMenuCounts(menus), [menus]);
  const allCount = useMemo(
    () => countVariantGroupsByAvailability(groups, filters, "all"),
    [filters, groups],
  );
  const unavailableCount = useMemo(
    () => countVariantGroupsByAvailability(groups, filters, "unavailable"),
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

  async function setGroupVisibility(groupId: string, visible: boolean): Promise<void> {
    setPendingGroupIds((current) => new Set(current).add(groupId));
    setError(null);

    try {
      const updated = await repository.updateVariantGroup(groupId, {
        visibility: visible ? "visible" : "hidden",
      });
      if (!updated) throw new Error(`Variant group ${groupId} was not found`);
      setGroups((current) => current.map((group) => (group.id === groupId ? updated : group)));
    } catch {
      setError("update");
    } finally {
      setPendingGroupIds((current) => {
        const next = new Set(current);
        next.delete(groupId);
        return next;
      });
    }
  }

  return {
    allCount,
    connectedMenuCounts,
    error,
    filteredGroups,
    filters,
    loading,
    pendingGroupIds,
    retry,
    setAvailability: (availability: VariantGroupAvailabilityFilter) =>
      updateFilters({ availability }),
    setGroupVisibility,
    setSearch: (search: string) => updateFilters({ search }),
    unavailableCount,
  };
}
