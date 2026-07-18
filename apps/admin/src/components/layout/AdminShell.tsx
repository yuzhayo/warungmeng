import { Layout } from "antd";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { adminMenuItems, getSelectedNavigationKey } from "../../app/navigation";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";
import "./AdminShell.css";

const { Content } = Layout;

export function AdminShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const selectedKey = getSelectedNavigationKey(location.pathname);

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
          items={adminMenuItems}
          mobile={mobile}
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
