import { theme } from "antd";
import type { ThemeConfig } from "antd";
import { getReadableTextColor, mixThemeColors, resolveAdminTextColor } from "./themeContrast";
import { DEFAULT_ADMIN_CUSTOM_THEME } from "./themeDefaults";
import type { AdminCustomThemeSettings, AdminThemeSettings } from "./themeTypes";

export function resolveAdminThemeValues(settings: AdminThemeSettings): AdminCustomThemeSettings {
  return settings.mode === "default" ? DEFAULT_ADMIN_CUSTOM_THEME : settings.custom;
}

export function createAdminTheme(settings: AdminThemeSettings): ThemeConfig {
  const values = resolveAdminThemeValues(settings);
  const textColor = resolveAdminTextColor(values);
  const primaryTextColor = getReadableTextColor(values.colorPrimary);
  const sidebarBackground = mixThemeColors(values.colorBgBase, textColor, 0.025);
  const sidebarHover = mixThemeColors(sidebarBackground, values.colorPrimary, 0.12);
  const sidebarSelected = mixThemeColors(sidebarBackground, values.colorPrimary, 0.24);
  const algorithms =
    values.density === "compact"
      ? [theme.darkAlgorithm, theme.compactAlgorithm]
      : theme.darkAlgorithm;

  return {
    algorithm: algorithms,
    token: {
      colorPrimary: values.colorPrimary,
      colorInfo: values.colorPrimary,
      colorBgBase: values.colorBgBase,
      colorTextBase: textColor,
      borderRadius: values.borderRadius,
      fontSize: values.fontSize,
    },
    components: {
      Layout: {
        bodyBg: values.colorBgBase,
        headerBg: values.colorPrimary,
        headerColor: primaryTextColor,
        headerHeight: 64,
        siderBg: sidebarBackground,
      },
      Menu: {
        darkItemBg: sidebarBackground,
        darkItemColor: textColor,
        darkItemHoverBg: sidebarHover,
        darkItemHoverColor: textColor,
        darkItemSelectedBg: sidebarSelected,
        darkItemSelectedColor: values.colorPrimary,
        itemBorderRadius: 0,
        itemMarginInline: 0,
      },
      Segmented: {
        itemActiveBg: mixThemeColors(values.colorPrimary, "#000000", 0.14),
        itemSelectedBg: values.colorPrimary,
        itemSelectedColor: primaryTextColor,
      },
    },
  };
}
