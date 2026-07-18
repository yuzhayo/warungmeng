import { describe, expect, it } from "vitest";
import {
  DARK_READABLE_TEXT,
  LIGHT_READABLE_TEXT,
  getContrastRatio,
  getReadableTextColor,
  meetsMinimumTextContrast,
  mixThemeColors,
} from "./themeContrast";

describe("themeContrast", () => {
  it("calculates the WCAG contrast ratio through Culori", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(meetsMinimumTextContrast(getContrastRatio("#777777", "#ffffff"))).toBe(false);
  });

  it("chooses the more readable supported text color", () => {
    expect(getReadableTextColor("#d99a27")).toBe(DARK_READABLE_TEXT);
    expect(getReadableTextColor("#181a1b")).toBe(LIGHT_READABLE_TEXT);
  });

  it("mixes derived theme colors through Culori", () => {
    expect(mixThemeColors("#000000", "#ffffff", 0.5)).toBe("#808080");
  });
});
