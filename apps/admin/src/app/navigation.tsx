import {
  AppstoreOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { TranslationKey } from "@warungmeng/i18n";
import type { MenuProps } from "antd";

export interface AdminNavigationItem {
  readonly key: string;
  readonly labelKey: TranslationKey;
  readonly icon: React.ReactNode;
}

export const adminNavigationItems: readonly AdminNavigationItem[] = [
  {
    key: "/",
    labelKey: "navigation.performance",
    icon: <BarChartOutlined aria-hidden />,
  },
  {
    key: "/menu",
    labelKey: "navigation.menu",
    icon: <AppstoreOutlined aria-hidden />,
  },
  {
    key: "/finance",
    labelKey: "navigation.finance",
    icon: <WalletOutlined aria-hidden />,
  },
  {
    key: "/calculator",
    labelKey: "navigation.calculator",
    icon: <CalculatorOutlined aria-hidden />,
  },
  {
    key: "/orders",
    labelKey: "navigation.orders",
    icon: <ShoppingCartOutlined aria-hidden />,
  },
  {
    key: "/settings",
    labelKey: "navigation.settings",
    icon: <SettingOutlined aria-hidden />,
  },
];

export function createAdminMenuItems(
  translate: (key: TranslationKey) => string,
): MenuProps["items"] {
  return adminNavigationItems.map(({ key, labelKey, icon }) => ({
    key,
    label: translate(labelKey),
    icon,
  }));
}

export function getSelectedNavigationKey(pathname: string): string {
  const matchingItem = [...adminNavigationItems]
    .filter((item) => item.key !== "/")
    .sort((left, right) => right.key.length - left.key.length)
    .find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`));

  return matchingItem?.key ?? "/";
}
