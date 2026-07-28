import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";

/**
 * Catalog surface the cashier browses. Composition satisfies this with the
 * `catalog.read` capability so POS never imports the Menu repository.
 */
export interface PosCatalogPort {
  listMenus(): Promise<readonly MenuItem[]>;
  listCategories(): Promise<readonly MenuCategory[]>;
  listVariantGroups(): Promise<readonly MenuVariantGroup[]>;
}
