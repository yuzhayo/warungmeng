import type { MenuItem, OrderVariantSelection, PosCartItem } from "@warungmeng/domain";
import {
  addPosCartItem,
  calculatePosItemLineTotal,
  calculatePosItemUnitPrice,
  removePosCartItem,
  setPosCartItemQuantity,
} from "@warungmeng/domain";

// Storefront-neutral adapter over the shared cart helpers. Components consume
// these names only; POS terminology must never reach customer-facing code.
export type StorefrontCartItem = PosCartItem;

export interface AddStorefrontCartItemInput {
  readonly menu: MenuItem;
  readonly variantSelections: readonly OrderVariantSelection[];
  readonly quantity: number;
  readonly note: string;
}

export type CartItemIdFactory = () => string;

export function createStorefrontCartItem(
  input: AddStorefrontCartItemInput,
  createId: CartItemIdFactory,
): StorefrontCartItem {
  return {
    id: createId(),
    menuItemId: input.menu.id,
    name: input.menu.name,
    unitPrice: { ...input.menu.price },
    variantSelections: input.variantSelections.map((selection) => ({
      ...selection,
      priceAdjustment: { ...selection.priceAdjustment },
    })),
    quantity: input.quantity,
    note: input.note.trim(),
  };
}

export function addStorefrontCartItem(
  items: readonly StorefrontCartItem[],
  incoming: StorefrontCartItem,
): readonly StorefrontCartItem[] {
  return addPosCartItem(items, incoming);
}

export function setStorefrontCartItemQuantity(
  items: readonly StorefrontCartItem[],
  itemId: string,
  quantity: number,
): readonly StorefrontCartItem[] {
  return setPosCartItemQuantity(items, itemId, quantity);
}

export function removeStorefrontCartItem(
  items: readonly StorefrontCartItem[],
  itemId: string,
): readonly StorefrontCartItem[] {
  return removePosCartItem(items, itemId);
}

// Replacing re-adds through the merge helper so an edit that produces a
// configuration identical to another line merges instead of duplicating.
export function replaceStorefrontCartItem(
  items: readonly StorefrontCartItem[],
  itemId: string,
  replacement: StorefrontCartItem,
): readonly StorefrontCartItem[] {
  return addPosCartItem(removePosCartItem(items, itemId), replacement);
}

// Edit mode reopens the configurator prefilled from a cart line; this is the
// bridge back to its selected-option-ids-by-group shape. Revalidation reuses
// it so both flows read a stored line identically.
export function groupCartItemSelections(
  item: StorefrontCartItem,
): Readonly<Record<string, readonly string[]>> {
  const byGroup: Record<string, string[]> = {};
  for (const selection of item.variantSelections) {
    byGroup[selection.groupId] = [...(byGroup[selection.groupId] ?? []), selection.optionId];
  }
  return byGroup;
}

export function calculateCartSubtotal(items: readonly StorefrontCartItem[]): number {
  return items.reduce((total, item) => total + calculatePosItemLineTotal(item), 0);
}

export function countCartItems(items: readonly StorefrontCartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function calculateCartItemUnitPrice(item: StorefrontCartItem): number {
  return calculatePosItemUnitPrice(item);
}

export function calculateCartItemLineTotal(item: StorefrontCartItem): number {
  return calculatePosItemLineTotal(item);
}

function draftItem(
  menu: MenuItem,
  variantSelections: readonly OrderVariantSelection[],
  quantity: number,
): StorefrontCartItem {
  return {
    id: "draft",
    menuItemId: menu.id,
    name: menu.name,
    unitPrice: menu.price,
    variantSelections,
    quantity,
    note: "",
  };
}

export function calculateDraftUnitPrice(
  menu: MenuItem,
  variantSelections: readonly OrderVariantSelection[],
): number {
  return calculatePosItemUnitPrice(draftItem(menu, variantSelections, 1));
}

export function calculateDraftLineTotal(
  menu: MenuItem,
  variantSelections: readonly OrderVariantSelection[],
  quantity: number,
): number {
  return calculatePosItemLineTotal(draftItem(menu, variantSelections, quantity));
}
