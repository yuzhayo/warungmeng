import type { MenuCategory, MenuItem } from "@warungmeng/domain";

export interface CatalogViewModel {
  readonly menus: readonly MenuItem[];
  readonly categories: readonly MenuCategory[];
}

export function buildCatalogViewModel(
  menus: readonly MenuItem[],
  categories: readonly MenuCategory[],
): CatalogViewModel {
  const visibleCategories = categories.filter((cat) => cat.visibility === "visible");
  const visibleCategoryIds = new Set(visibleCategories.map((category) => category.id));
  const visibleMenus = menus.filter(
    (menu) => menu.visibility === "visible" && visibleCategoryIds.has(menu.categoryId),
  );

  // Filter categories to only those that have at least one visible menu
  const categoriesWithVisibleMenus = visibleCategories.filter((category) =>
    visibleMenus.some((menu) => menu.categoryId === category.id),
  );

  return {
    menus: visibleMenus,
    categories: categoriesWithVisibleMenus,
  };
}

export function getFeaturedMenus(viewModel: CatalogViewModel, limit = 4): readonly MenuItem[] {
  // Get first N available menus
  return viewModel.menus.filter((menu) => menu.availability.status === "available").slice(0, limit);
}

export function filterMenusByCategory(
  viewModel: CatalogViewModel,
  categoryId: string,
): readonly MenuItem[] {
  return viewModel.menus.filter((menu) => menu.categoryId === categoryId);
}

export function searchCatalogMenus(
  viewModel: CatalogViewModel,
  query: string,
): readonly MenuItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return viewModel.menus;

  return viewModel.menus.filter(
    (menu) =>
      menu.name.toLowerCase().includes(normalizedQuery) ||
      menu.description.toLowerCase().includes(normalizedQuery),
  );
}

export function isMenuAvailableForDisplay(menu: MenuItem): boolean {
  return menu.availability.status === "available";
}
