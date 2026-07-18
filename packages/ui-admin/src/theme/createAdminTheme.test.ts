import { describe, expect, it } from "vitest";
import { createAdminTheme } from "./createAdminTheme";
import { DEFAULT_ADMIN_THEME_SETTINGS } from "./themeDefaults";
import type { AdminThemeSettings } from "./themeTypes";

describe("createAdminTheme", () => {
  it("creates the current dark amber default theme", () => {
    const config = createAdminTheme(DEFAULT_ADMIN_THEME_SETTINGS);

    expect(config.token).toMatchObject({
      colorPrimary: "#d99a27",
      colorBgBase: "#181a1b",
      colorTextBase: "#f0ede7",
      fontSize: 16,
      borderRadius: 4,
    });
    expect(config.components?.Layout).toMatchObject({
      headerBg: "#d99a27",
      headerColor: "#181a1b",
    });
  });

  it("derives component colors and compact algorithm from custom seed tokens", () => {
    const settings: AdminThemeSettings = {
      schemaVersion: 1,
      mode: "custom",
      custom: {
        colorPrimary: "#55ccaa",
        colorBgBase: "#101418",
        fontSize: 18,
        density: "compact",
        borderRadius: 10,
      },
    };

    const config = createAdminTheme(settings);

    expect(config.token).toMatchObject({
      colorPrimary: "#55ccaa",
      colorBgBase: "#101418",
      fontSize: 18,
      borderRadius: 10,
    });
    expect(config.algorithm).toBeInstanceOf(Array);
    expect(config.components?.Segmented).toMatchObject({
      itemSelectedBg: "#55ccaa",
    });
  });
});
