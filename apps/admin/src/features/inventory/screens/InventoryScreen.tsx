import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { TabbedScreenLayout } from "../../../components/layout/TabbedScreenLayout";
import "./InventoryScreen.css";

const MATERIALS_TAB = "materials";
const MOVEMENTS_TAB = "movements";
const HPP_TAB = "hpp";

export function InventoryScreen() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTabKey = location.pathname.includes("/movements")
    ? MOVEMENTS_TAB
    : location.pathname.includes("/hpp")
      ? HPP_TAB
      : MATERIALS_TAB;
  const tabs = useMemo(
    () => [
      { key: MATERIALS_TAB, label: t("inventory.tabs.materials") },
      { key: MOVEMENTS_TAB, label: t("inventory.tabs.movements") },
      { key: HPP_TAB, label: t("inventory.tabs.hpp") },
    ],
    [t],
  );

  return (
    <TabbedScreenLayout
      activeTabKey={activeTabKey}
      className="inventory-screen"
      description={t("screen.inventory.description")}
      onTabChange={(key) => navigate(key === MATERIALS_TAB ? "/inventory" : `/inventory/${key}`)}
      tabAriaLabel={t("inventory.tabs.label")}
      tabs={tabs}
      title={t("screen.inventory.title")}
      titleId="inventory-screen-title"
    >
      <Outlet />
    </TabbedScreenLayout>
  );
}
