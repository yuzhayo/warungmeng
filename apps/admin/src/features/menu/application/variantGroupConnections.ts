import type { MenuCatalogRepository } from "@warungmeng/data";
import type { MenuItem } from "@warungmeng/domain";

export interface VariantGroupConnectionChange {
  readonly menuId: string;
  readonly variantGroupIds: readonly string[];
}

export function getConnectedMenuIds(
  menus: readonly MenuItem[],
  variantGroupId: string,
): readonly string[] {
  return menus
    .filter((menu) => menu.variantGroupIds.includes(variantGroupId))
    .map((menu) => menu.id);
}

export function createVariantGroupConnectionChanges(
  menus: readonly MenuItem[],
  variantGroupId: string,
  connectedMenuIds: readonly string[],
): readonly VariantGroupConnectionChange[] {
  const selectedIds = new Set(connectedMenuIds);

  return menus.flatMap((menu) => {
    const isConnected = menu.variantGroupIds.includes(variantGroupId);
    const shouldConnect = selectedIds.has(menu.id);
    if (isConnected === shouldConnect) return [];

    return [
      {
        menuId: menu.id,
        variantGroupIds: shouldConnect
          ? [...menu.variantGroupIds, variantGroupId]
          : menu.variantGroupIds.filter((id) => id !== variantGroupId),
      },
    ];
  });
}

export async function syncVariantGroupConnections(
  repository: MenuCatalogRepository,
  menus: readonly MenuItem[],
  variantGroupId: string,
  connectedMenuIds: readonly string[],
): Promise<void> {
  const changes = createVariantGroupConnectionChanges(menus, variantGroupId, connectedMenuIds);

  for (const change of changes) {
    const updated = await repository.updateMenu(change.menuId, {
      variantGroupIds: change.variantGroupIds,
    });
    if (!updated) {
      throw new Error(`Menu ${change.menuId} was not found while updating variant connections`);
    }
  }
}
