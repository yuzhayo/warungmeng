import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuCategory, MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import {
  storefrontMenuDetailRepository,
  type StorefrontMenuDetailRepository,
} from "../../catalog/application/storefrontCatalogRepository";

export interface CartCatalogSnapshot {
  readonly menus: readonly MenuItem[];
  readonly categories: readonly MenuCategory[];
  readonly variantGroups: readonly MenuVariantGroup[];
}

export type CartCatalogSnapshotState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; snapshot: CartCatalogSnapshot };

type InternalState = {
  readonly repository: StorefrontMenuDetailRepository;
} & (
  { status: "loading" } | { status: "error" } | { status: "ready"; snapshot: CartCatalogSnapshot }
);

// Loads the catalog data the cart revalidates against. Same visibility scope
// as the menu detail flow so both screens judge sellability identically.
export function useCartCatalogSnapshot(
  repository: StorefrontMenuDetailRepository = storefrontMenuDetailRepository,
): CartCatalogSnapshotState {
  const [state, setState] = useState<InternalState>({ repository, status: "loading" });
  const isMountedRef = useRef(false);
  const requestCounterRef = useRef(0);

  const runRequest = useCallback((source: StorefrontMenuDetailRepository) => {
    const requestId = ++requestCounterRef.current;

    void Promise.all([
      source.listMenus({ visibility: "visible" }),
      source.listCategories(),
      source.listVariantGroups(),
    ])
      .then(([menus, categories, variantGroups]) => {
        if (!isMountedRef.current || requestId !== requestCounterRef.current) return;
        setState({
          repository: source,
          status: "ready",
          snapshot: { menus, categories, variantGroups },
        });
      })
      .catch(() => {
        if (!isMountedRef.current || requestId !== requestCounterRef.current) return;
        setState({ repository: source, status: "error" });
      });
  }, []);

  const retry = useCallback(() => {
    setState({ repository, status: "loading" });
    runRequest(repository);
  }, [repository, runRequest]);

  useEffect(() => {
    isMountedRef.current = true;
    runRequest(repository);

    return () => {
      isMountedRef.current = false;
      requestCounterRef.current += 1;
    };
  }, [repository, runRequest]);

  if (state.repository !== repository) return { status: "loading" };
  if (state.status === "error") return { status: "error", retry };
  if (state.status === "ready") return { status: "ready", snapshot: state.snapshot };
  return { status: "loading" };
}
