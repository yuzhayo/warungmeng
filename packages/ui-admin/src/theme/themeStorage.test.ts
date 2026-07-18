import { describe, expect, it } from "vitest";
import { DEFAULT_ADMIN_THEME_SETTINGS } from "./themeDefaults";
import {
  ADMIN_THEME_STORAGE_KEY,
  loadAdminThemeSettings,
  parseAdminThemeSettings,
  persistAdminThemeSettings,
} from "./themeStorage";
import type { AdminThemeSettings } from "./themeTypes";

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

const customSettings: AdminThemeSettings = {
  schemaVersion: 2,
  mode: "custom",
  custom: {
    colorPrimary: "#2f9e8f",
    colorBgBase: "#101820",
    textColorMode: "manual",
    colorTextBase: "#f2eadf",
    fontSize: 18,
    density: "compact",
    borderRadius: 8,
  },
};

describe("themeStorage", () => {
  it("returns defaults when storage is empty or unavailable", () => {
    expect(loadAdminThemeSettings(null)).toEqual(DEFAULT_ADMIN_THEME_SETTINGS);
    expect(loadAdminThemeSettings(createMemoryStorage())).toEqual(DEFAULT_ADMIN_THEME_SETTINGS);
  });

  it("persists and loads a valid custom theme", () => {
    const storage = createMemoryStorage();
    persistAdminThemeSettings(storage, customSettings);

    expect(storage.getItem(ADMIN_THEME_STORAGE_KEY)).not.toBeNull();
    expect(loadAdminThemeSettings(storage)).toEqual(customSettings);
  });

  it("rejects malformed, unsupported, and out-of-range settings", () => {
    expect(parseAdminThemeSettings({})).toBeNull();
    expect(
      parseAdminThemeSettings({
        ...customSettings,
        schemaVersion: 3,
      }),
    ).toBeNull();
    expect(
      parseAdminThemeSettings({
        ...customSettings,
        custom: { ...customSettings.custom, colorPrimary: "amber" },
      }),
    ).toBeNull();
    expect(
      parseAdminThemeSettings({
        ...customSettings,
        custom: { ...customSettings.custom, borderRadius: 40 },
      }),
    ).toBeNull();
  });

  it("migrates schema version 1 without discarding the saved theme", () => {
    const legacySettings = {
      schemaVersion: 1,
      mode: "custom",
      custom: {
        colorPrimary: "#2F9E8F",
        colorBgBase: "#101820",
        fontSize: 18,
        density: "compact",
        borderRadius: 8,
      },
    };

    expect(parseAdminThemeSettings(legacySettings)).toEqual({
      ...customSettings,
      custom: {
        ...customSettings.custom,
        colorPrimary: "#2f9e8f",
        textColorMode: "auto",
        colorTextBase: "#f0ede7",
      },
    });

    const storage = createMemoryStorage();
    storage.setItem("warungmeng.admin.theme.v1", JSON.stringify(legacySettings));
    expect(loadAdminThemeSettings(storage)).toEqual(parseAdminThemeSettings(legacySettings));
  });

  it("falls back safely when stored JSON is invalid", () => {
    const storage = createMemoryStorage();
    storage.setItem(ADMIN_THEME_STORAGE_KEY, "{invalid");

    expect(loadAdminThemeSettings(storage)).toEqual(DEFAULT_ADMIN_THEME_SETTINGS);
  });
});
