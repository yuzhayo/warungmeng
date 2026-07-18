import { theme } from "antd";
import type { ThemeConfig } from "antd";
import { DEFAULT_ADMIN_CUSTOM_THEME } from "./themeDefaults";
import type { AdminCustomThemeSettings, AdminThemeSettings } from "./themeTypes";

interface RgbColor {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

function parseHexColor(value: string): RgbColor {
  const normalized = value.replace("#", "");
  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function toHexColor({ red, green, blue }: RgbColor): string {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixColors(base: string, overlay: string, overlayWeight: number): string {
  const baseRgb = parseHexColor(base);
  const overlayRgb = parseHexColor(overlay);
  const baseWeight = 1 - overlayWeight;

  return toHexColor({
    red: baseRgb.red * baseWeight + overlayRgb.red * overlayWeight,
    green: baseRgb.green * baseWeight + overlayRgb.green * overlayWeight,
    blue: baseRgb.blue * baseWeight + overlayRgb.blue * overlayWeight,
  });
}

function relativeLuminance(color: string): number {
  const { red, green, blue } = parseHexColor(color);
  const channels = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });

  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function readableText(background: string): string {
  const backgroundLuminance = relativeLuminance(background);
  const darkText = "#181a1b";
  const lightText = "#f0ede7";
  const darkContrast =
    (Math.max(backgroundLuminance, relativeLuminance(darkText)) + 0.05) /
    (Math.min(backgroundLuminance, relativeLuminance(darkText)) + 0.05);
  const lightContrast =
    (Math.max(backgroundLuminance, relativeLuminance(lightText)) + 0.05) /
    (Math.min(backgroundLuminance, relativeLuminance(lightText)) + 0.05);

  return darkContrast >= lightContrast ? darkText : lightText;
}

function resolveThemeValues(settings: AdminThemeSettings): AdminCustomThemeSettings {
  return settings.mode === "default" ? DEFAULT_ADMIN_CUSTOM_THEME : settings.custom;
}

export function createAdminTheme(settings: AdminThemeSettings): ThemeConfig {
  const values = resolveThemeValues(settings);
  const textColor = readableText(values.colorBgBase);
  const primaryTextColor = readableText(values.colorPrimary);
  const sidebarBackground = mixColors(values.colorBgBase, textColor, 0.025);
  const sidebarHover = mixColors(sidebarBackground, values.colorPrimary, 0.12);
  const sidebarSelected = mixColors(sidebarBackground, values.colorPrimary, 0.24);
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
        itemActiveBg: mixColors(values.colorPrimary, "#000000", 0.14),
        itemSelectedBg: values.colorPrimary,
        itemSelectedColor: primaryTextColor,
      },
    },
  };
}
