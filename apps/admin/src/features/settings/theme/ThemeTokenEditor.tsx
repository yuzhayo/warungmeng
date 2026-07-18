import type {
  AdminCustomThemePatch,
  AdminCustomThemeSettings,
  AdminThemeDensity,
  AdminThemeFontSize,
} from "@warungmeng/ui-admin";
import { Card, ColorPicker, Flex, InputNumber, Segmented, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface ThemeSettingRowProps {
  readonly children: ReactNode;
  readonly description: string;
  readonly label: string;
}

export interface ThemeTokenEditorProps {
  readonly disabled: boolean;
  readonly settings: AdminCustomThemeSettings;
  readonly onChange: (patch: AdminCustomThemePatch) => void;
}

function ThemeSettingRow({ children, description, label }: ThemeSettingRowProps) {
  return (
    <Flex align="center" gap="large" justify="space-between" wrap>
      <Flex style={{ flex: "1 1 18rem" }} vertical>
        <Typography.Text strong>{label}</Typography.Text>
        <Typography.Text type="secondary">{description}</Typography.Text>
      </Flex>
      {children}
    </Flex>
  );
}

export function ThemeTokenEditor({ disabled, settings, onChange }: ThemeTokenEditorProps) {
  const { t } = useTranslation();

  return (
    <Card title={t("theme.custom.title")}>
      <Flex gap="large" vertical>
        <Typography.Text type="secondary">{t("theme.custom.description")}</Typography.Text>

        <ThemeSettingRow
          description={t("theme.custom.accentDescription")}
          label={t("theme.custom.accent")}
        >
          <ColorPicker
            aria-label={t("theme.custom.accent")}
            disabled={disabled}
            disabledAlpha
            onChangeComplete={(color) => onChange({ colorPrimary: color.toHexString() })}
            showText
            value={settings.colorPrimary}
          />
        </ThemeSettingRow>

        <ThemeSettingRow
          description={t("theme.custom.backgroundDescription")}
          label={t("theme.custom.background")}
        >
          <ColorPicker
            aria-label={t("theme.custom.background")}
            disabled={disabled}
            disabledAlpha
            onChangeComplete={(color) => onChange({ colorBgBase: color.toHexString() })}
            showText
            value={settings.colorBgBase}
          />
        </ThemeSettingRow>

        <ThemeSettingRow
          description={t("theme.custom.fontSizeDescription")}
          label={t("theme.custom.fontSize")}
        >
          <Segmented
            aria-label={t("theme.custom.fontSize")}
            disabled={disabled}
            onChange={(value) => onChange({ fontSize: value as AdminThemeFontSize })}
            options={[
              { label: "14 px", value: 14 },
              { label: "16 px", value: 16 },
              { label: "18 px", value: 18 },
            ]}
            value={settings.fontSize}
          />
        </ThemeSettingRow>

        <ThemeSettingRow
          description={t("theme.custom.densityDescription")}
          label={t("theme.custom.density")}
        >
          <Segmented
            aria-label={t("theme.custom.density")}
            disabled={disabled}
            onChange={(value) => onChange({ density: value as AdminThemeDensity })}
            options={[
              { label: t("theme.custom.density.normal"), value: "normal" },
              { label: t("theme.custom.density.compact"), value: "compact" },
            ]}
            value={settings.density}
          />
        </ThemeSettingRow>

        <ThemeSettingRow
          description={t("theme.custom.radiusDescription")}
          label={t("theme.custom.radius")}
        >
          <InputNumber
            aria-label={t("theme.custom.radius")}
            disabled={disabled}
            max={16}
            min={0}
            onChange={(value) => {
              if (typeof value === "number") onChange({ borderRadius: value });
            }}
            suffix="px"
            value={settings.borderRadius}
          />
        </ThemeSettingRow>
      </Flex>
    </Card>
  );
}
