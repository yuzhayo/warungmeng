import { useLocaleSettings, WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { Spin } from "antd";
import enUS from "antd/locale/en_US";
import idID from "antd/locale/id_ID";
import type { ReactNode } from "react";
import { AdminRuntimeProvider, useAdminRuntimeSnapshot } from "../composition/AdminRuntimeProvider";
import type { AdminRuntime } from "../composition/adminRuntime";

function AdminRuntimeContent({ children }: { readonly children: ReactNode }) {
  const { language } = useLocaleSettings();
  const { status } = useAdminRuntimeSnapshot();
  if (status === "idle" || status === "loading") {
    const message = language === "id" ? "Memuat aplikasi admin..." : "Loading admin application...";
    return (
      <div aria-busy="true" aria-label={message} aria-live="polite" role="status">
        <Spin description={message} />
      </div>
    );
  }
  return children;
}

interface LocalizedAdminProvidersProps {
  readonly children: ReactNode;
  readonly runtime: AdminRuntime;
}

function LocalizedAdminProviders({ children, runtime }: LocalizedAdminProvidersProps) {
  const { language } = useLocaleSettings();

  return (
    <AdminUiProvider locale={language === "id" ? idID : enUS}>
      <AdminRuntimeProvider runtime={runtime}>
        <AdminRuntimeContent>{children}</AdminRuntimeContent>
      </AdminRuntimeProvider>
    </AdminUiProvider>
  );
}

export interface AdminApplicationProvidersProps {
  readonly children: ReactNode;
  readonly runtime: AdminRuntime;
}

export function AdminApplicationProviders({ children, runtime }: AdminApplicationProvidersProps) {
  return (
    <WarungMengI18nProvider>
      <LocalizedAdminProviders runtime={runtime}>{children}</LocalizedAdminProviders>
    </WarungMengI18nProvider>
  );
}
