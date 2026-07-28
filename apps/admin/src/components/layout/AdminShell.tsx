import { Layout } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { createAdminMenuItems } from "../../app/navigation";
import {
  getAdminNavigationSelectedKey,
  resolveAdminNavigation,
} from "../../app/navigation/resolveAdminNavigation";
import { resolveAdminRoutes } from "../../app/routing/resolveAdminRoutes";
import { useAdminRuntime } from "../../app/composition/AdminRuntimeProvider";
import { resolveAdminManifestSet } from "../../app/discovery/adminBuiltInManifests";
import type { TranslationKey } from "@warungmeng/i18n";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import "./AdminShell.css";

const { Content } = Layout;

export function AdminShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const runtime = useAdminRuntime();

  const navigation = useMemo(() => {
    const { manifests } = resolveAdminManifestSet(runtime.registry.list());
    const routeResolution = resolveAdminRoutes(manifests);
    const resolution = resolveAdminNavigation(
      manifests,
      (key: TranslationKey) => t(key),
      routeResolution.resolvedRouteIds,
      routeResolution.routePaths,
    );
    return {
      items: createAdminMenuItems((key) => t(key), resolution.items),
      viewModel: resolution.items,
    };
  }, [t, runtime]);
  const selectedKey = getAdminNavigationSelectedKey(location.pathname, navigation.viewModel);

  function handleBreakpoint(isMobile: boolean): void {
    setMobile(isMobile);
    if (isMobile) setCollapsed(true);
  }

  return (
    <Layout className="admin-shell">
      <AdminHeader
        onToggleSidebar={() => setCollapsed((current) => !current)}
        sidebarCollapsed={collapsed}
      />
      <Layout className="admin-shell__body" hasSider>
        <AdminSidebar
          collapsed={collapsed}
          items={navigation.items}
          mobile={mobile}
          navigationLabel={t("navigation.primary")}
          onBreakpoint={handleBreakpoint}
          onCollapse={setCollapsed}
          onNavigate={navigate}
          selectedKey={selectedKey}
        />
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
