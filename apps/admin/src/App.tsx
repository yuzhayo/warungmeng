import { useLocaleSettings, WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import enUS from "antd/locale/en_US";
import idID from "antd/locale/id_ID";
import { HashRouter } from "react-router-dom";
import { AppRoutes } from "./app/AppRoutes";

function LocalizedAdminApp() {
  const { language } = useLocaleSettings();

  return (
    <AdminUiProvider locale={language === "id" ? idID : enUS}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AdminUiProvider>
  );
}

export default function App() {
  return (
    <WarungMengI18nProvider>
      <LocalizedAdminApp />
    </WarungMengI18nProvider>
  );
}
