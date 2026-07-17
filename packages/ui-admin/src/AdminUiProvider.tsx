import { App as AntdApp, ConfigProvider } from "antd";
import type { ThemeConfig } from "antd";
import type { PropsWithChildren } from "react";
import { adminTheme } from "./adminTheme";

type AdminUiProviderProps = PropsWithChildren<{
  themeConfig?: ThemeConfig;
}>;

export function AdminUiProvider({ children, themeConfig = adminTheme }: AdminUiProviderProps) {
  return (
    <ConfigProvider theme={themeConfig}>
      <AntdApp component={false}>{children}</AntdApp>
    </ConfigProvider>
  );
}
