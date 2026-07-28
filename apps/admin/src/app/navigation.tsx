import type { TranslationKey } from "@warungmeng/i18n";
import type { MenuProps } from "antd";
import { getNavIcon } from "./navigation/adminIconRegistry";
import type { AdminNavigationItemViewModel } from "./navigation/adminNavigationViewModel";
import { getAdminNavigationSelectedKey } from "./navigation/resolveAdminNavigation";

/**
 * Materializes the serializable navigation view model into AntD menu items.
 * Concrete icons remain app-local and never leak into feature manifests.
 */
export function createAdminMenuItems(
  translate: (key: TranslationKey) => string,
  items: readonly AdminNavigationItemViewModel[],
): MenuProps["items"] {
  return items.map((item) => {
    const children = item.children ? createAdminMenuItems(translate, item.children) : undefined;
    return {
      key: item.key,
      label: translate(item.labelKey),
      icon: getNavIcon(item.iconId),
      ...(children && children.length > 0 ? { children } : {}),
    };
  });
}

export function getSelectedNavigationKey(pathname: string): string {
  return getAdminNavigationSelectedKey(pathname);
}
