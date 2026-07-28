import {
  AppstoreOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";

// Concrete AntD icons stay in this app-local registry. Manifest files only
// contain stable serializable IDs.
const registry: Record<string, ReactNode> = {
  "bar-chart": <BarChartOutlined aria-hidden />,
  "app-grid": <AppstoreOutlined aria-hidden />,
  wallet: <WalletOutlined aria-hidden />,
  database: <DatabaseOutlined aria-hidden />,
  shop: <ShopOutlined aria-hidden />,
  "shopping-cart": <ShoppingCartOutlined aria-hidden />,
  settings: <SettingOutlined aria-hidden />,
};

export function getNavIcon(iconId: string): ReactNode | undefined {
  return registry[iconId];
}
