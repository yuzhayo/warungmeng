import type { Locale } from "antd/es/locale";
import type { PropsWithChildren } from "react";
import { AdminThemeProvider } from "./theme/AdminThemeProvider";

type AdminUiProviderProps = PropsWithChildren<{
  locale?: Locale;
  storage?: Pick<Storage, "getItem" | "setItem"> | null;
}>;

export function AdminUiProvider({ children, locale, storage }: AdminUiProviderProps) {
  return (
    <AdminThemeProvider locale={locale} storage={storage}>
      {children}
    </AdminThemeProvider>
  );
}
