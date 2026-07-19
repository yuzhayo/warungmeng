import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { TabbedScreenLayout } from "../../components/layout/TabbedScreenLayout";

const THEME_TAB_KEY = "theme";
const BUSINESS_HOURS_TAB_KEY = "business-hours";

export function SettingsScreen() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTabKey = location.pathname.includes("/business-hours")
    ? BUSINESS_HOURS_TAB_KEY
    : THEME_TAB_KEY;
  const tabs = useMemo(
    () => [
      { key: THEME_TAB_KEY, label: t("settings.tabs.theme") },
      {
        key: BUSINESS_HOURS_TAB_KEY,
        label: t("settings.tabs.businessHours"),
      },
    ],
    [t],
  );

  return (
    <TabbedScreenLayout
      activeTabKey={activeTabKey}
      description={t("screen.settings.description")}
      onTabChange={(key) => navigate(`/settings/${key}`)}
      tabAriaLabel={t("settings.tabs.label")}
      tabs={tabs}
      title={t("screen.settings.title")}
      titleId="settings-screen-title"
    >
      <Outlet />
    </TabbedScreenLayout>
  );
}
