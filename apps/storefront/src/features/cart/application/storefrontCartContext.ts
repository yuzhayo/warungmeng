import { createContext, useContext } from "react";
import type { AddStorefrontCartItemInput, StorefrontCartItem } from "./storefrontCartModel";

export interface StorefrontCartActions {
  addItem(input: AddStorefrontCartItemInput): void;
  updateItemQuantity(itemId: string, quantity: number): void;
  removeItem(itemId: string): void;
  replaceItem(itemId: string, input: AddStorefrontCartItemInput): void;
  clearCart(): void;
}

export interface StorefrontCartContextValue extends StorefrontCartActions {
  readonly items: readonly StorefrontCartItem[];
}

export const StorefrontCartContext = createContext<StorefrontCartContextValue | null>(null);

export function useStorefrontCart(): StorefrontCartContextValue {
  const context = useContext(StorefrontCartContext);
  if (!context) {
    throw new Error("useStorefrontCart must be used inside StorefrontCartProvider");
  }
  return context;
}
