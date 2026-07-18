import type { AdminThemeMode } from "@warungmeng/ui-admin";
import { Card, Flex, Segmented, Typography } from "antd";
import { useTranslation } from "react-i18next";

export interface ThemeModeControlProps {
  readonly mode: AdminThemeMode;
  readonly onChange: (mode: AdminThemeMode) => void;
}

export function ThemeModeControl({ mode, onChange }: ThemeModeControlProps) {
  const { t } = useTranslation();

  return (
    <Card title={t("theme.mode.title")}>
      <Flex gap="middle" vertical>
        <Typography.Text type="secondary">{t("theme.mode.description")}</Typography.Text>
        <Segmented
          aria-label={t("theme.mode.label")}
          block
          name="admin-theme-mode"
          onChange={(value) => onChange(value as AdminThemeMode)}
          options={[
            { label: t("theme.mode.default"), value: "default" },
            { label: t("theme.mode.custom"), value: "custom" },
          ]}
          value={mode}
        />
      </Flex>
    </Card>
  );
}
