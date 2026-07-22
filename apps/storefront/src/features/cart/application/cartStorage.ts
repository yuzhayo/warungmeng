import type { StorefrontCartItem } from "./storefrontCartModel";

export const CART_STORAGE_KEY = "wm.storefront.cart.v1";
const CART_STORAGE_VERSION = 1;

export type CartStorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface StoredCartSnapshot {
  readonly version: number;
  readonly items: readonly StorefrontCartItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMoney(value: unknown): value is { amount: number; currency: "IDR" } {
  return (
    isRecord(value) &&
    typeof value.amount === "number" &&
    Number.isFinite(value.amount) &&
    value.currency === "IDR"
  );
}

function isVariantSelection(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.groupId === "string" &&
    typeof value.groupName === "string" &&
    typeof value.optionId === "string" &&
    typeof value.optionName === "string" &&
    isMoney(value.priceAdjustment)
  );
}

function isStoredCartItem(value: unknown): value is StorefrontCartItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.menuItemId === "string" &&
    value.menuItemId.length > 0 &&
    typeof value.name === "string" &&
    isMoney(value.unitPrice) &&
    Array.isArray(value.variantSelections) &&
    value.variantSelections.every(isVariantSelection) &&
    typeof value.quantity === "number" &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    typeof value.note === "string"
  );
}

export function loadStoredCartItems(
  storage: CartStorageLike | null,
): readonly StorefrontCartItem[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== CART_STORAGE_VERSION) return [];
    if (!Array.isArray(parsed.items)) return [];

    return parsed.items.filter(isStoredCartItem);
  } catch {
    return [];
  }
}

export function saveStoredCartItems(
  storage: CartStorageLike | null,
  items: readonly StorefrontCartItem[],
): void {
  if (!storage) return;

  try {
    const snapshot: StoredCartSnapshot = { version: CART_STORAGE_VERSION, items };
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Storage failure falls back to in-memory behavior without crashing.
  }
}

export function clearStoredCart(storage: CartStorageLike | null): void {
  if (!storage) return;

  try {
    storage.removeItem(CART_STORAGE_KEY);
  } catch {
    // Ignore storage failures; the in-memory cart remains authoritative.
  }
}
