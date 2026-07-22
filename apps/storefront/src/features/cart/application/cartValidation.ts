import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import {
  calculatePosItemUnitPrice,
  isMenuSellable,
  resolvePosVariantSelections,
} from "@warungmeng/domain";
import { groupCartItemSelections, type StorefrontCartItem } from "./storefrontCartModel";

export type CartLineIssue =
  "menu-missing" | "menu-unavailable" | "variant-invalid" | "price-changed" | "stock-shortage";

export interface CartLineValidation {
  readonly item: StorefrontCartItem;
  readonly menu: MenuItem | null;
  readonly issues: readonly CartLineIssue[];
  readonly valid: boolean;
}

export interface CartValidationResult {
  readonly lines: readonly CartLineValidation[];
  readonly allValid: boolean;
}

interface CatalogSnapshot {
  readonly menus: readonly MenuItem[];
  readonly categories: readonly MenuCategory[];
  readonly variantGroups: readonly MenuVariantGroup[];
}

function validateLine(item: StorefrontCartItem, snapshot: CatalogSnapshot): CartLineValidation {
  const visibleCategoryIds = new Set(
    snapshot.categories
      .filter((category) => category.visibility === "visible")
      .map((category) => category.id),
  );
  const menu =
    snapshot.menus.find(
      (candidate) =>
        candidate.id === item.menuItemId &&
        candidate.visibility === "visible" &&
        visibleCategoryIds.has(candidate.categoryId),
    ) ?? null;

  if (!menu) {
    return { item, menu: null, issues: ["menu-missing"], valid: false };
  }

  const issues: CartLineIssue[] = [];

  if (!isMenuSellable(menu)) {
    issues.push("menu-unavailable");
  }

  const selectedByGroup = groupCartItemSelections(item);
  const connectedGroupIds = new Set(menu.variantGroupIds);
  const hasOrphanSelection = item.variantSelections.some(
    (selection) => !connectedGroupIds.has(selection.groupId),
  );
  // A hidden group is unavailable to customers and must be treated like a
  // missing group even though the shared POS resolver is visibility-neutral.
  const visibleVariantGroups = snapshot.variantGroups.filter(
    (group) => group.visibility === "visible",
  );
  const resolution = resolvePosVariantSelections(menu, visibleVariantGroups, selectedByGroup);
  if (hasOrphanSelection || !resolution.valid) {
    issues.push("variant-invalid");
  } else {
    // Compare stored display pricing against a freshly priced identical configuration.
    const currentUnitPrice = calculatePosItemUnitPrice({
      ...item,
      unitPrice: menu.price,
      variantSelections: resolution.selections,
    });
    if (currentUnitPrice !== calculatePosItemUnitPrice(item)) {
      issues.push("price-changed");
    }
  }

  if (menu.inventory.mode === "tracked" && item.quantity > menu.inventory.quantity) {
    issues.push("stock-shortage");
  }

  return { item, menu, issues, valid: issues.length === 0 };
}

export function validateCartItems(
  items: readonly StorefrontCartItem[],
  snapshot: CatalogSnapshot,
): CartValidationResult {
  const lines = items.map((item) => validateLine(item, snapshot));
  return { lines, allValid: lines.every((line) => line.valid) };
}
