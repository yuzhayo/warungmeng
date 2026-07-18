import {
  ADMIN_THEME_SCHEMA_VERSION,
  type AdminCustomThemeSettings,
  type AdminThemeSettings,
} from "./themeTypes";

export const DEFAULT_ADMIN_CUSTOM_THEME: AdminCustomThemeSettings = {
  colorPrimary: "#d99a27",
  colorBgBase: "#181a1b",
  textColorMode: "auto",
  colorTextBase: "#f0ede7",
  fontSize: 16,
  density: "normal",
  borderRadius: 4,
};

export const DEFAULT_ADMIN_THEME_SETTINGS: AdminThemeSettings = {
  schemaVersion: ADMIN_THEME_SCHEMA_VERSION,
  mode: "default",
  custom: DEFAULT_ADMIN_CUSTOM_THEME,
};
