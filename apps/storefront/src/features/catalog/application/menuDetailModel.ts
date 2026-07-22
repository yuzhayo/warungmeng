import type {
  MenuCategory,
  MenuItem,
  MenuVariantGroup,
  MenuVariantOption,
} from "@warungmeng/domain";

export interface MenuVariantGroupResolution {
  readonly groups: readonly MenuVariantGroup[];
  readonly missingGroupIds: readonly string[];
}

export function resolveMenuBySlug(
  menus: readonly MenuItem[],
  categories: readonly MenuCategory[],
  slug: string,
): MenuItem | null {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;

  const visibleCategoryIds = new Set(
    categories
      .filter((category) => category.visibility === "visible")
      .map((category) => category.id),
  );

  return (
    menus.find(
      (menu) =>
        menu.slug === normalizedSlug &&
        menu.visibility === "visible" &&
        visibleCategoryIds.has(menu.categoryId),
    ) ?? null
  );
}

export function resolveMenuVariantGroups(
  menu: MenuItem,
  allGroups: readonly MenuVariantGroup[],
): MenuVariantGroupResolution {
  const groupsById = new Map(allGroups.map((group) => [group.id, group]));
  const groups: MenuVariantGroup[] = [];
  const missingGroupIds: string[] = [];

  for (const groupId of menu.variantGroupIds) {
    const group = groupsById.get(groupId);
    if (group?.visibility === "visible") {
      groups.push(group);
    } else {
      missingGroupIds.push(groupId);
    }
  }

  return { groups, missingGroupIds };
}

// Mirrors the option filter used by the shared selection resolver so the UI
// disables exactly the options the domain would reject as unavailable.
export function isVariantOptionSelectable(option: MenuVariantOption): boolean {
  return (
    option.availability.status === "available" &&
    (option.inventory.mode === "untracked" || option.inventory.quantity > 0)
  );
}

export function getMaxSelectableQuantity(menu: MenuItem, untrackedMaximum: number): number {
  if (menu.inventory.mode === "tracked") {
    return Math.max(1, menu.inventory.quantity);
  }
  return Math.max(1, untrackedMaximum);
}

export function clampQuantity(quantity: number, maximum: number): number {
  if (!Number.isFinite(quantity)) return 1;
  const integer = Math.trunc(quantity);
  return Math.min(Math.max(integer, 1), maximum);
}
