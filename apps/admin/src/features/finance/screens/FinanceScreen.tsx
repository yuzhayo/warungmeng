import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { TabbedScreenLayout } from "../../../components/layout/TabbedScreenLayout";
import "./FinanceScreen.css";

const OVERVIEW_TAB = "overview";
const TRANSACTIONS_TAB = "transactions";
const EXPENSES_TAB = "expenses";

function getActiveFinanceTab(pathname: string): string {
  if (pathname.includes("/transactions")) return TRANSACTIONS_TAB;
  if (pathname.includes("/expenses")) return EXPENSES_TAB;
  return OVERVIEW_TAB;
}

export function FinanceScreen() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = useMemo(
    () => [
      { key: OVERVIEW_TAB, label: t("finance.tabs.overview") },
      { key: TRANSACTIONS_TAB, label: t("finance.tabs.transactions") },
      { key: EXPENSES_TAB, label: t("finance.tabs.expenses") },
    ],
    [t],
  );

  return (
    <TabbedScreenLayout
      activeTabKey={getActiveFinanceTab(location.pathname)}
      className="finance-screen"
      description={t("screen.finance.description")}
      onTabChange={(key) => navigate(`/finance/${key}`)}
      tabAriaLabel={t("finance.tabs.label")}
      tabs={tabs}
      title={t("screen.finance.title")}
      titleId="finance-screen-title"
    >
      <div className="finance-screen__content">
        <Outlet />
      </div>
    </TabbedScreenLayout>
  );
}
