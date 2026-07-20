import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuCategory, MenuItem } from "@warungmeng/domain";
import {
  storefrontCatalogRepository,
  type StorefrontCatalogRepository,
} from "./storefrontCatalogRepository";

export type CatalogLoadState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "ready"; menus: readonly MenuItem[]; categories: readonly MenuCategory[] };

type InternalCatalogLoadState =
  | { repository: StorefrontCatalogRepository; status: "loading" }
  | { repository: StorefrontCatalogRepository; status: "error" }
  | {
      repository: StorefrontCatalogRepository;
      status: "ready";
      menus: readonly MenuItem[];
      categories: readonly MenuCategory[];
    };

export function useStorefrontCatalog(
  repository: StorefrontCatalogRepository = storefrontCatalogRepository,
): CatalogLoadState {
  const [state, setState] = useState<InternalCatalogLoadState>({
    repository,
    status: "loading",
  });
  const isMountedRef = useRef(false);
  const requestCounterRef = useRef(0);

  const runRequest = useCallback((source: StorefrontCatalogRepository) => {
    const requestId = ++requestCounterRef.current;

    void Promise.all([source.listMenus({ visibility: "visible" }), source.listCategories()])
      .then(([menus, categories]) => {
        if (!isMountedRef.current || requestId !== requestCounterRef.current) return;
        setState({ repository: source, status: "ready", menus, categories });
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
  if (state.status === "ready") {
    return { status: "ready", menus: state.menus, categories: state.categories };
  }
  return { status: "loading" };
}
