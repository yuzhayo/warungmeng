import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";

/**
 * Read surface published as `catalog.read`. The Menu Catalog repository
 * satisfies it structurally; POS catalog browsing and Inventory HPP consume
 * it through composition instead of importing the Menu repository.
 */
export interface CatalogReadCapability {
  listMenus(): Promise<readonly MenuItem[]>;
  listCategories(): Promise<readonly MenuCategory[]>;
  listVariantGroups(): Promise<readonly MenuVariantGroup[]>;
}
