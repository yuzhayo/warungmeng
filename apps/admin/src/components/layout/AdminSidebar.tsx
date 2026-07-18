import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";

const { Sider } = Layout;

export interface AdminSidebarProps {
  readonly collapsed: boolean;
  readonly mobile: boolean;
  readonly items: MenuProps["items"];
  readonly selectedKey: string;
  readonly onBreakpoint: (mobile: boolean) => void;
  readonly onCollapse: (collapsed: boolean) => void;
  readonly onNavigate: (path: string) => void;
}

export function AdminSidebar({
  collapsed,
  mobile,
  items,
  selectedKey,
  onBreakpoint,
  onCollapse,
  onNavigate,
}: AdminSidebarProps) {
  return (
    <Sider
      breakpoint="lg"
      className="admin-sidebar"
      collapsed={collapsed}
      collapsedWidth={mobile ? 0 : 72}
      collapsible
      onBreakpoint={onBreakpoint}
      onCollapse={onCollapse}
      theme="dark"
      trigger={null}
      width="clamp(15rem, 19vw, 18rem)"
    >
      <nav aria-label="Navigasi utama" className="admin-sidebar__navigation">
        <Menu
          items={items}
          mode="inline"
          onClick={({ key }) => onNavigate(key)}
          selectedKeys={[selectedKey]}
          theme="dark"
        />
      </nav>
    </Sider>
  );
}
