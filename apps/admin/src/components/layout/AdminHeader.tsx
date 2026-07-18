import {
  BellOutlined,
  CalendarOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { supportedLanguages, useLocaleSettings, type SupportedLanguage } from "@warungmeng/i18n";
import { Button, Dropdown, Layout } from "antd";
import type { MenuProps } from "antd";
import { useTranslation } from "react-i18next";
import { useCurrentDateTime } from "../../hooks/useCurrentDateTime";

const { Header } = Layout;

export interface AdminHeaderProps {
  readonly sidebarCollapsed: boolean;
  readonly onToggleSidebar: () => void;
}

export function AdminHeader({ sidebarCollapsed, onToggleSidebar }: AdminHeaderProps) {
  const { t } = useTranslation();
  const { language, regionalFormat, setLanguage } = useLocaleSettings();
  const currentDateTime = useCurrentDateTime(regionalFormat);
  const languageItems: MenuProps["items"] = supportedLanguages.map((itemLanguage) => ({
    key: itemLanguage,
    label: t(`language.${itemLanguage}`),
  }));

  function handleLanguageChange(key: string): void {
    if (supportedLanguages.includes(key as SupportedLanguage)) {
      setLanguage(key as SupportedLanguage);
    }
  }

  return (
    <Header className="admin-header">
      <div className="admin-header__brand">
        <Button
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? t("header.openSidebar") : t("header.closeSidebar")}
          color="default"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleSidebar}
          variant="text"
        />
        <span className="admin-header__brand-name">WARUNG MENG</span>
      </div>

      <div className="admin-header__actions">
        <Dropdown
          menu={{
            items: languageItems,
            onClick: ({ key }) => handleLanguageChange(key),
            selectable: true,
            selectedKeys: [language],
          }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Button
            aria-label={`${t("header.language")}: ${t(`language.${language}`)}`}
            className="admin-header__language"
            color="default"
            icon={<TranslationOutlined />}
            variant="text"
          >
            {language.toLocaleUpperCase()}
          </Button>
        </Dropdown>
        <Button
          aria-label={t("header.notifications")}
          className="admin-header__notification"
          color="default"
          icon={<BellOutlined />}
          variant="text"
        >
          <span className="admin-header__action-label">{t("header.notifications")}</span>
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
