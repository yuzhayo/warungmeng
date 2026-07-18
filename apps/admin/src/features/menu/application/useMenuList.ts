import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuCategory, MenuItem } from "@warungmeng/domain";
import { useEffect, useMemo, useState } from "react";
import {
  countMenusByAvailability,
  createCategoryCounts,
  DEFAULT_MENU_LIST_FILTERS,
  filterMenuItems,
  type MenuAvailabilityFilter,
  type MenuListFilters,
} from "./menuListModel";

export type MenuListError = "load" | "update" | null;

export function useMenuList(repository: MenuCatalogRepository) {
  const [menus, setMenus] = useState<readonly MenuItem[]>([]);
  const [categories, setCategories] = useState<readonly MenuCategory[]>([]);
  const [filters, setFilters] = useState<MenuListFilters>(DEFAULT_MENU_LIST_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<MenuListError>(null);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [pendingMenuIds, setPendingMenuIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    void Promise.all([repository.listMenus(), repository.listCategories()])
      .then(([nextMenus, nextCategories]) => {
        if (cancelled) return;
        setMenus(nextMenus);
        setCategories(nextCategories);
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

  const filteredMenus = useMemo(() => filterMenuItems(menus, filters), [filters, menus]);
  const categoryCounts = useMemo(() => createCategoryCounts(menus, filters), [filters, menus]);
  const allCount = useMemo(() => countMenusByAvailability(menus, filters, "all"), [filters, menus]);
  const unavailableCount = useMemo(
    () => countMenusByAvailability(menus, filters, "unavailable"),
    [filters, menus],
  );

  function updateFilters(patch: Partial<MenuListFilters>): void {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function retry(): void {
    setLoading(true);
    setError(null);
    setReloadVersion((current) => current + 1);
  }

  async function updateMenu(
    menuId: string,
    patch: Parameters<MenuCatalogRepository["updateMenu"]>[1],
  ): Promise<void> {
    setPendingMenuIds((current) => new Set(current).add(menuId));
    setError(null);

    try {
      const updated = await repository.updateMenu(menuId, patch);
      if (!updated) throw new Error(`Menu ${menuId} was not found`);
      setMenus((current) => current.map((menu) => (menu.id === menuId ? updated : menu)));
    } catch {
      setError("update");
    } finally {
      setPendingMenuIds((current) => {
        const next = new Set(current);
        next.delete(menuId);
        return next;
      });
    }
  }

  function setSearch(search: string): void {
    updateFilters({ search });
  }

  function setCategory(categoryId: string | null): void {
    updateFilters({ categoryId });
  }

  function setAvailability(availability: MenuAvailabilityFilter): void {
    updateFilters({ availability });
  }

  function setMenuAvailability(menuId: string, available: boolean): Promise<void> {
    return updateMenu(menuId, {
      availability: available
        ? { status: "available" }
        : { status: "unavailable", unavailableUntil: null },
    });
  }

  function setMenuVisibility(menuId: string, visible: boolean): Promise<void> {
    return updateMenu(menuId, { visibility: visible ? "visible" : "hidden" });
  }

  return {
    allCount,
    categories,
    categoryCounts,
    error,
    filteredMenus,
    filters,
    loading,
    pendingMenuIds,
    retry,
    setAvailability,
    setCategory,
    setMenuAvailability,
    setMenuVisibility,
    setSearch,
    unavailableCount,
  };
}
