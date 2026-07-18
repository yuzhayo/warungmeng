import {
  formatHex,
  interpolate,
  modeLrgb,
  modeRgb,
  useMode as registerColorMode,
  wcagContrast,
} from "culori/fn";
import type { AdminCustomThemeSettings } from "./themeTypes";

registerColorMode(modeRgb);
registerColorMode(modeLrgb);

export const MINIMUM_TEXT_CONTRAST = 4.5;
export const DARK_READABLE_TEXT = "#181a1b";
export const LIGHT_READABLE_TEXT = "#f0ede7";

export function getContrastRatio(foreground: string, background: string): number {
  return wcagContrast(foreground, background);
}

export function meetsMinimumTextContrast(ratio: number): boolean {
  return ratio >= MINIMUM_TEXT_CONTRAST;
}

export function getReadableTextColor(background: string): string {
  const darkContrast = getContrastRatio(DARK_READABLE_TEXT, background);
  const lightContrast = getContrastRatio(LIGHT_READABLE_TEXT, background);

  return darkContrast >= lightContrast ? DARK_READABLE_TEXT : LIGHT_READABLE_TEXT;
}

export function resolveAdminTextColor(settings: AdminCustomThemeSettings): string {
  return settings.textColorMode === "manual"
    ? settings.colorTextBase
    : getReadableTextColor(settings.colorBgBase);
}

export function mixThemeColors(base: string, overlay: string, overlayWeight: number): string {
  const interpolator = interpolate([base, overlay], "rgb");
  return formatHex(interpolator(overlayWeight));
}
