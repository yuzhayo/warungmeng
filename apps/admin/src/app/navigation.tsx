import {
  AppstoreOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

export interface AdminNavigationItem {
  readonly key: string;
  readonly label: string;
  readonly icon: React.ReactNode;
}

export const adminNavigationItems: readonly AdminNavigationItem[] = [
  { key: "/", label: "Performa Outlet", icon: <BarChartOutlined aria-hidden /> },
  { key: "/menu", label: "Menu", icon: <AppstoreOutlined aria-hidden /> },
  { key: "/finance", label: "Keuangan", icon: <WalletOutlined aria-hidden /> },
  { key: "/calculator", label: "Calculator", icon: <CalculatorOutlined aria-hidden /> },
  {
    key: "/orders",
    label: "Manajemen Pesanan",
    icon: <ShoppingCartOutlined aria-hidden />,
  },
  { key: "/settings", label: "Pengaturan", icon: <SettingOutlined aria-hidden /> },
];

export const adminMenuItems: MenuProps["items"] = adminNavigationItems.map(
  ({ key, label, icon }) => ({
    key,
    label,
    icon,
  }),
);

export function getSelectedNavigationKey(pathname: string): string {
  const matchingItem = [...adminNavigationItems]
    .filter((item) => item.key !== "/")
    .sort((left, right) => right.key.length - left.key.length)
    .find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`));

  return matchingItem?.key ?? "/";
}
