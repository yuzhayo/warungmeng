import {
  getContrastRatio,
  getReadableTextColor,
  meetsMinimumTextContrast,
  resolveAdminTextColor,
  resolveAdminThemeValues,
  type AdminThemeSettings,
} from "@warungmeng/ui-admin";
import { Card, Flex, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

export interface ThemeContrastStatusProps {
  readonly settings: AdminThemeSettings;
}

interface ContrastRowProps {
  readonly label: string;
  readonly ratio: number;
}

function ContrastRow({ label, ratio }: ContrastRowProps) {
  const { t } = useTranslation();
  const passes = meetsMinimumTextContrast(ratio);

  return (
    <Flex align="center" gap="middle" justify="space-between" wrap>
      <Typography.Text>{label}</Typography.Text>
      <Flex align="center" gap="small">
        <Typography.Text code>
          {t("theme.contrast.ratio", { ratio: ratio.toFixed(2) })}
        </Typography.Text>
        <Tag color={passes ? "success" : "warning"}>
          {t(passes ? "theme.contrast.safe" : "theme.contrast.warning")}
        </Tag>
      </Flex>
    </Flex>
  );
}

export function ThemeContrastStatus({ settings }: ThemeContrastStatusProps) {
  const { t } = useTranslation();
  const values = resolveAdminThemeValues(settings);
  const textColor = resolveAdminTextColor(values);
  const primaryTextColor = getReadableTextColor(values.colorPrimary);

  return (
    <Card title={t("theme.contrast.title")}>
      <Flex gap="middle" vertical>
        <Typography.Text type="secondary">{t("theme.contrast.description")}</Typography.Text>
        <ContrastRow
          label={t("theme.contrast.bodyText")}
          ratio={getContrastRatio(textColor, values.colorBgBase)}
        />
        <ContrastRow
          label={t("theme.contrast.primaryAction")}
          ratio={getContrastRatio(primaryTextColor, values.colorPrimary)}
        />
      </Flex>
    </Card>
  );
}
