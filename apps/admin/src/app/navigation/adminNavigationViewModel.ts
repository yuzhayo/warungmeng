import type { TranslationKey } from "@warungmeng/i18n";

/**
 * Deterministic navigation view model produced by {@link resolveAdminNavigation}.
 * The shell renders these items; it never reads raw manifests or centralized
 * route/navigation definitions.
 */
export interface AdminNavigationItemViewModel {
  readonly moduleId?: string;
  readonly key: string;
  readonly labelKey: TranslationKey;
  readonly iconId: string;
  readonly order?: number;
  readonly routeId?: string;
  readonly children?: readonly AdminNavigationItemViewModel[];
}

/**
 * Recursively collects every label key reachable from a navigation tree so
 * translation coverage can be validated transitively (parent + nested items).
 */
export function collectNavigationLabelKeys(
  items: readonly AdminNavigationItemViewModel[],
): readonly TranslationKey[] {
  return items.flatMap((item) => [
    item.labelKey,
    ...(item.children ? collectNavigationLabelKeys(item.children) : []),
  ]);
}
