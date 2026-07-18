import { Tabs, Typography, type TabsProps } from "antd";
import type { ReactNode } from "react";
import "./TabbedScreenLayout.css";

export interface TabbedScreenLayoutProps {
  readonly activeTabKey: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly description: ReactNode;
  readonly onTabChange?: (activeKey: string) => void;
  readonly tabAriaLabel: string;
  readonly tabs: NonNullable<TabsProps["items"]>;
  readonly title: ReactNode;
  readonly titleId: string;
}

const { Paragraph, Title } = Typography;

export function TabbedScreenLayout({
  activeTabKey,
  children,
  className,
  description,
  onTabChange,
  tabAriaLabel,
  tabs,
  title,
  titleId,
}: TabbedScreenLayoutProps) {
  const rootClassName = ["tabbed-screen-layout", className].filter(Boolean).join(" ");

  return (
    <section aria-labelledby={titleId} className={rootClassName}>
      <header className="tabbed-screen-layout__header">
        <Title id={titleId} level={2}>
          {title}
        </Title>
        <Paragraph type="secondary">{description}</Paragraph>
      </header>

      <Tabs
        activeKey={activeTabKey}
        aria-label={tabAriaLabel}
        items={tabs}
        onChange={onTabChange}
      />

      {children}
    </section>
  );
}
