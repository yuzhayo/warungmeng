import type { MenuItem } from "@warungmeng/domain";

/**
 * Narrow catalog port for HPP: menu prices and identities only. Composition
 * satisfies this with the `catalog.read` capability so Inventory never
 * imports the Menu repository.
 */
export interface InventoryCatalogReadPort {
  listMenus(): Promise<readonly MenuItem[]>;
}
