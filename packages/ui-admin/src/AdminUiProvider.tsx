import { App as AntdApp, ConfigProvider } from "antd";
import type { ThemeConfig } from "antd";
import type { Locale } from "antd/es/locale";
import type { PropsWithChildren } from "react";
import { adminTheme } from "./adminTheme";

type AdminUiProviderProps = PropsWithChildren<{
  locale?: Locale;
  themeConfig?: ThemeConfig;
}>;

export function AdminUiProvider({
  children,
  locale,
  themeConfig = adminTheme,
}: AdminUiProviderProps) {
  return (
    <ConfigProvider locale={locale} theme={themeConfig}>
      <AntdApp component={false}>{children}</AntdApp>
    </ConfigProvider>
  );
}
