import {
  BellOutlined,
  CalendarOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, Layout } from "antd";
import { useCurrentDateTime } from "../../hooks/useCurrentDateTime";

const { Header } = Layout;

export interface AdminHeaderProps {
  readonly sidebarCollapsed: boolean;
  readonly onToggleSidebar: () => void;
}

export function AdminHeader({ sidebarCollapsed, onToggleSidebar }: AdminHeaderProps) {
  const currentDateTime = useCurrentDateTime();

  return (
    <Header className="admin-header">
      <div className="admin-header__brand">
        <Button
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
          color="default"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleSidebar}
          variant="text"
        />
        <span className="admin-header__brand-name">WARUNG MENG</span>
      </div>

      <div className="admin-header__actions">
        <Button
          aria-label="Notifikasi"
          className="admin-header__notification"
          color="default"
          icon={<BellOutlined />}
          variant="text"
        >
          <span className="admin-header__action-label">Notifikasi</span>
        </Button>
        <div aria-label={`${currentDateTime.date} ${currentDateTime.time}`} className="admin-clock">
          <CalendarOutlined aria-hidden />
          <span>
            <strong>{currentDateTime.date}</strong>
            <small>{currentDateTime.time}</small>
          </span>
        </div>
      </div>
    </Header>
  );
}
