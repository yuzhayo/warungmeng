import { DEFAULT_ADMIN_THEME_SETTINGS } from "./themeDefaults";
import {
  ADMIN_THEME_SCHEMA_VERSION,
  type AdminCustomThemeSettings,
  type AdminThemeDensity,
  type AdminThemeFontSize,
  type AdminThemeMode,
  type AdminThemeSettings,
} from "./themeTypes";

export const ADMIN_THEME_STORAGE_KEY = "warungmeng.admin.theme.v1";

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const FONT_SIZES: readonly AdminThemeFontSize[] = [14, 16, 18];
const DENSITIES: readonly AdminThemeDensity[] = ["normal", "compact"];
const MODES: readonly AdminThemeMode[] = ["default", "custom"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCustomThemeSettings(value: unknown): value is AdminCustomThemeSettings {
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

export function parseAdminThemeSettings(value: unknown): AdminThemeSettings | null {
  if (!isRecord(value)) return null;
  if (value.schemaVersion !== ADMIN_THEME_SCHEMA_VERSION) return null;
  if (!MODES.includes(value.mode as AdminThemeMode)) return null;
  if (!isCustomThemeSettings(value.custom)) return null;

  return {
    schemaVersion: ADMIN_THEME_SCHEMA_VERSION,
    mode: value.mode as AdminThemeMode,
    custom: {
      colorPrimary: value.custom.colorPrimary.toLowerCase(),
      colorBgBase: value.custom.colorBgBase.toLowerCase(),
      fontSize: value.custom.fontSize,
      density: value.custom.density,
      borderRadius: value.custom.borderRadius,
    },
  };
}

export function loadAdminThemeSettings(storage: ThemeStorage | null): AdminThemeSettings {
  if (!storage) return DEFAULT_ADMIN_THEME_SETTINGS;

  try {
    const storedValue = storage.getItem(ADMIN_THEME_STORAGE_KEY);
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
