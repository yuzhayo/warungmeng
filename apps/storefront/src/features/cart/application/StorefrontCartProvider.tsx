import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import {
  clearStoredCart,
  loadStoredCartItems,
  saveStoredCartItems,
  type CartStorageLike,
} from "./cartStorage";
import { StorefrontCartContext } from "./storefrontCartContext";
import {
  addStorefrontCartItem,
  createStorefrontCartItem,
  removeStorefrontCartItem,
  replaceStorefrontCartItem,
  setStorefrontCartItemQuantity,
  type AddStorefrontCartItemInput,
  type CartItemIdFactory,
  type StorefrontCartItem,
} from "./storefrontCartModel";

const defaultIdFactory: CartItemIdFactory = () => crypto.randomUUID();

function defaultStorage(): CartStorageLike | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

interface StorefrontCartProviderProps extends PropsWithChildren {
  createItemId?: CartItemIdFactory;
  storage?: CartStorageLike | null;
}

export function StorefrontCartProvider({
  children,
  createItemId = defaultIdFactory,
  storage = defaultStorage(),
}: StorefrontCartProviderProps) {
  // Hydrate synchronously exactly once so cart-dependent UI never flickers.
  const [items, setItems] = useState<readonly StorefrontCartItem[]>(() =>
    loadStoredCartItems(storage),
  );

  useEffect(() => {
    if (items.length === 0) {
      clearStoredCart(storage);
    } else {
      saveStoredCartItems(storage, items);
    }
  }, [items, storage]);

  const addItem = useCallback(
    (input: AddStorefrontCartItemInput) => {
      setItems((current) =>
        addStorefrontCartItem(current, createStorefrontCartItem(input, createItemId)),
      );
    },
    [createItemId],
  );

  const updateItemQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((current) => setStorefrontCartItemQuantity(current, itemId, quantity));
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((current) => removeStorefrontCartItem(current, itemId));
  }, []);

  const replaceItem = useCallback(
    (itemId: string, input: AddStorefrontCartItemInput) => {
      setItems((current) =>
        replaceStorefrontCartItem(current, itemId, createStorefrontCartItem(input, createItemId)),
      );
    },
    [createItemId],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({ items, addItem, updateItemQuantity, removeItem, replaceItem, clearCart }),
    [items, addItem, updateItemQuantity, removeItem, replaceItem, clearCart],
  );

  return <StorefrontCartContext.Provider value={value}>{children}</StorefrontCartContext.Provider>;
}
