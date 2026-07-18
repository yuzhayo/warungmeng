import { DEFAULT_ADMIN_THEME_SETTINGS } from "./themeDefaults";
import {
  ADMIN_THEME_SCHEMA_VERSION,
  type AdminCustomThemeSettings,
  type AdminThemeDensity,
  type AdminThemeFontSize,
  type AdminThemeMode,
  type AdminThemeSettings,
  type AdminThemeTextColorMode,
} from "./themeTypes";

export const ADMIN_THEME_STORAGE_KEY = "warungmeng.admin.theme.v2";

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const FONT_SIZES: readonly AdminThemeFontSize[] = [14, 16, 18];
const DENSITIES: readonly AdminThemeDensity[] = ["normal", "compact"];
const MODES: readonly AdminThemeMode[] = ["default", "custom"];
const TEXT_COLOR_MODES: readonly AdminThemeTextColorMode[] = ["auto", "manual"];
const LEGACY_ADMIN_THEME_SCHEMA_VERSION = 1;
const LEGACY_ADMIN_THEME_STORAGE_KEY = "warungmeng.admin.theme.v1";

type LegacyAdminCustomThemeSettings = Omit<
  AdminCustomThemeSettings,
  "colorTextBase" | "textColorMode"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLegacyCustomThemeSettings(value: unknown): value is LegacyAdminCustomThemeSettings {
  if (!isRecord(value)) return false;

  return (
    typeof value.colorPrimary === "string" &&
    HEX_COLOR_PATTERN.test(value.colorPrimary) &&
    typeof value.colorBgBase === "string" &&
    HEX_COLOR_PATTERN.test(value.colorBgBase) &&
    FONT_SIZES.includes(value.fontSize as AdminThemeFontSize) &&
    DENSITIES.includes(value.density as AdminThemeDensity) &&
    typeof value.borderRadius === "number" &&
    Number.isInteger(value.borderRadius) &&
    value.borderRadius >= 0 &&
    value.borderRadius <= 16
  );
}

function isCustomThemeSettings(value: unknown): value is AdminCustomThemeSettings {
  if (!isLegacyCustomThemeSettings(value) || !isRecord(value)) return false;
  const candidate = value as Record<string, unknown>;

  return (
    TEXT_COLOR_MODES.includes(candidate.textColorMode as AdminThemeTextColorMode) &&
    typeof candidate.colorTextBase === "string" &&
    HEX_COLOR_PATTERN.test(candidate.colorTextBase)
  );
}

export function parseAdminThemeSettings(value: unknown): AdminThemeSettings | null {
  if (!isRecord(value)) return null;
  if (!MODES.includes(value.mode as AdminThemeMode)) return null;

  const isLegacy = value.schemaVersion === LEGACY_ADMIN_THEME_SCHEMA_VERSION;
  if (!isLegacy && value.schemaVersion !== ADMIN_THEME_SCHEMA_VERSION) return null;
  if (
    isLegacy ? !isLegacyCustomThemeSettings(value.custom) : !isCustomThemeSettings(value.custom)
  ) {
    return null;
  }

  const custom = value.custom as LegacyAdminCustomThemeSettings &
    Partial<Pick<AdminCustomThemeSettings, "colorTextBase" | "textColorMode">>;

  return {
    schemaVersion: ADMIN_THEME_SCHEMA_VERSION,
    mode: value.mode as AdminThemeMode,
    custom: {
      colorPrimary: custom.colorPrimary.toLowerCase(),
      colorBgBase: custom.colorBgBase.toLowerCase(),
      textColorMode: custom.textColorMode ?? DEFAULT_ADMIN_THEME_SETTINGS.custom.textColorMode,
      colorTextBase: (
        custom.colorTextBase ?? DEFAULT_ADMIN_THEME_SETTINGS.custom.colorTextBase
      ).toLowerCase(),
      fontSize: custom.fontSize,
      density: custom.density,
      borderRadius: custom.borderRadius,
    },
  };
}

export function loadAdminThemeSettings(storage: ThemeStorage | null): AdminThemeSettings {
  if (!storage) return DEFAULT_ADMIN_THEME_SETTINGS;

  try {
    const storedValue =
      storage.getItem(ADMIN_THEME_STORAGE_KEY) ?? storage.getItem(LEGACY_ADMIN_THEME_STORAGE_KEY);
    if (!storedValue) return DEFAULT_ADMIN_THEME_SETTINGS;
    return parseAdminThemeSettings(JSON.parse(storedValue)) ?? DEFAULT_ADMIN_THEME_SETTINGS;
  } catch {
    return DEFAULT_ADMIN_THEME_SETTINGS;
  }
}

export function persistAdminThemeSettings(
  storage: ThemeStorage | null,
  settings: AdminThemeSettings,
): void {
  if (!storage) return;
  storage.setItem(ADMIN_THEME_STORAGE_KEY, JSON.stringify(settings));
}

export function adminThemeSettingsEqual(
  left: AdminThemeSettings,
  right: AdminThemeSettings,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
