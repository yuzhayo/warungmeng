import { useLocaleSettings, WarungMengI18nProvider } from "@warungmeng/i18n";
import { ConfigProvider } from "antd";
import idID from "antd/locale/id_ID";
import enUS from "antd/locale/en_US";
import { App as AntdApp } from "antd";
import { BrowserRouter } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { StorefrontCartProvider } from "../features/cart/application/StorefrontCartProvider";
import { storefrontTheme } from "./storefrontTheme";

function AntdLocaleProvider({ children }: PropsWithChildren) {
  const { language } = useLocaleSettings();
  const antdLocale = language === "id" ? idID : enUS;

  return (
    <ConfigProvider locale={antdLocale} theme={storefrontTheme}>
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}

export function ApplicationProviders({ children }: PropsWithChildren) {
  return (
    <WarungMengI18nProvider>
      <AntdLocaleProvider>
        <StorefrontCartProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </StorefrontCartProvider>
      </AntdLocaleProvider>
    </WarungMengI18nProvider>
  );
}
