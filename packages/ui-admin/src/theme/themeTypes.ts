export const ADMIN_THEME_SCHEMA_VERSION = 2 as const;

export type AdminThemeMode = "default" | "custom";
export type AdminThemeDensity = "normal" | "compact";
export type AdminThemeFontSize = 14 | 16 | 18;
export type AdminThemeTextColorMode = "auto" | "manual";

export interface AdminCustomThemeSettings {
  readonly colorPrimary: string;
  readonly colorBgBase: string;
  readonly textColorMode: AdminThemeTextColorMode;
  readonly colorTextBase: string;
  readonly fontSize: AdminThemeFontSize;
  readonly density: AdminThemeDensity;
  readonly borderRadius: number;
}

export interface AdminThemeSettings {
  readonly schemaVersion: typeof ADMIN_THEME_SCHEMA_VERSION;
  readonly mode: AdminThemeMode;
  readonly custom: AdminCustomThemeSettings;
}

export type AdminCustomThemePatch = Partial<AdminCustomThemeSettings>;
