import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuItem, MenuVariantGroup } from "@warungmeng/domain";
import { resolveMenuBySlug, resolveMenuVariantGroups } from "./menuDetailModel";
import {
  storefrontMenuDetailRepository,
  type StorefrontMenuDetailRepository,
} from "./storefrontCatalogRepository";

export type MenuDetailState =
  | { status: "loading" }
  | { status: "error"; retry: () => void }
  | { status: "not-found" }
  | {
      status: "ready";
      menu: MenuItem;
      variantGroups: readonly MenuVariantGroup[];
      missingGroupIds: readonly string[];
    };

interface RequestKey {
  readonly repository: StorefrontMenuDetailRepository;
  readonly slug: string;
}

type InternalState = RequestKey &
  (
    | { status: "loading" }
    | { status: "error" }
    | { status: "not-found" }
    | {
        status: "ready";
        menu: MenuItem;
        variantGroups: readonly MenuVariantGroup[];
        missingGroupIds: readonly string[];
      }
  );

export function useMenuDetail(
  menuSlug: string,
  repository: StorefrontMenuDetailRepository = storefrontMenuDetailRepository,
): MenuDetailState {
  const [state, setState] = useState<InternalState>({
    repository,
    slug: menuSlug,
    status: "loading",
  });
  const isMountedRef = useRef(false);
  const requestCounterRef = useRef(0);

  const runRequest = useCallback((source: StorefrontMenuDetailRepository, slug: string) => {
    const requestId = ++requestCounterRef.current;

    void Promise.all([
      source.listMenus({ visibility: "visible" }),
      source.listCategories(),
      source.listVariantGroups(),
    ])
      .then(([menus, categories, allGroups]) => {
        if (!isMountedRef.current || requestId !== requestCounterRef.current) return;

        const menu = resolveMenuBySlug(menus, categories, slug);
        if (!menu) {
          setState({ repository: source, slug, status: "not-found" });
          return;
        }

        const { groups, missingGroupIds } = resolveMenuVariantGroups(menu, allGroups);
        setState({
          repository: source,
          slug,
          status: "ready",
          menu,
          variantGroups: groups,
          missingGroupIds,
        });
      })
      .catch(() => {
        if (!isMountedRef.current || requestId !== requestCounterRef.current) return;
        setState({ repository: source, slug, status: "error" });
      });
  }, []);

  const retry = useCallback(() => {
    setState({ repository, slug: menuSlug, status: "loading" });
    runRequest(repository, menuSlug);
  }, [repository, menuSlug, runRequest]);

  useEffect(() => {
    isMountedRef.current = true;
    runRequest(repository, menuSlug);

    return () => {
      isMountedRef.current = false;
      requestCounterRef.current += 1;
    };
  }, [repository, menuSlug, runRequest]);

  if (state.repository !== repository || state.slug !== menuSlug) return { status: "loading" };
  if (state.status === "error") return { status: "error", retry };
  if (state.status === "ready") {
    return {
      status: "ready",
      menu: state.menu,
      variantGroups: state.variantGroups,
      missingGroupIds: state.missingGroupIds,
    };
  }
  if (state.status === "not-found") return { status: "not-found" };
  return { status: "loading" };
}
