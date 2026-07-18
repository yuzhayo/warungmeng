import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { TabbedScreenLayout } from "../../../components/layout/TabbedScreenLayout";

const LIST_TAB_KEY = "list";
const VARIANTS_TAB_KEY = "variants";

export function MenuScreen() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTabKey = location.pathname.includes("/menu/variants")
    ? VARIANTS_TAB_KEY
    : LIST_TAB_KEY;
  const tabs = useMemo(
    () => [
      { key: LIST_TAB_KEY, label: t("menu.tabs.list") },
      { key: VARIANTS_TAB_KEY, label: t("menu.tabs.variants") },
    ],
    [t],
  );

  function handleTabChange(key: string): void {
    navigate(key === VARIANTS_TAB_KEY ? "/menu/variants" : "/menu");
  }

  return (
    <TabbedScreenLayout
      activeTabKey={activeTabKey}
      className="menu-screen"
      description={t("screen.menu.description")}
      onTabChange={handleTabChange}
      tabAriaLabel={t("menu.tabs.label")}
      tabs={tabs}
      title={t("screen.menu.title")}
      titleId="menu-screen-title"
    >
      <Outlet />
    </TabbedScreenLayout>
  );
}
