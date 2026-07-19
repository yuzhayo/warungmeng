import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import { useEffect, useMemo, useState } from "react";

interface CatalogLoadResult {
  readonly requestKey: number;
  readonly menus: readonly MenuItem[];
  readonly categories: readonly MenuCategory[];
  readonly variantGroups: readonly MenuVariantGroup[];
  readonly error: boolean;
}

export function usePosCatalog(repository: MenuCatalogRepository) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [loadResult, setLoadResult] = useState<CatalogLoadResult>({
    requestKey: -1,
    menus: [],
    categories: [],
    variantGroups: [],
    error: false,
  });

  useEffect(() => {
    let active = true;
    void Promise.all([
      repository.listMenus(),
      repository.listCategories(),
      repository.listVariantGroups(),
    ])
      .then(([menus, categories, variantGroups]) => {
        if (active) {
          setLoadResult({
            requestKey: reloadToken,
            menus,
            categories,
            variantGroups,
            error: false,
          });
        }
      })
      .catch(() => {
        if (active) {
          setLoadResult({
            requestKey: reloadToken,
            menus: [],
            categories: [],
            variantGroups: [],
            error: true,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [reloadToken, repository]);

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const menus = useMemo(
    () =>
      loadResult.menus.filter(
        (menu) =>
          menu.visibility === "visible" &&
          (!categoryId || menu.categoryId === categoryId) &&
          (!normalizedSearch ||
            menu.name.toLocaleLowerCase().includes(normalizedSearch) ||
            menu.description.toLocaleLowerCase().includes(normalizedSearch)),
      ),
    [categoryId, loadResult.menus, normalizedSearch],
  );

  return {
    menus,
    allMenus: loadResult.menus,
    categories: loadResult.categories.filter((category) => category.visibility === "visible"),
    variantGroups: loadResult.variantGroups,
    search,
    categoryId,
    setSearch,
    setCategoryId,
    loading: loadResult.requestKey !== reloadToken,
    error: loadResult.requestKey === reloadToken && loadResult.error,
    retry: () => setReloadToken((current) => current + 1),
  };
}
