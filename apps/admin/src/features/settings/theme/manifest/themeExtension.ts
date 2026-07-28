import type { WarungMengExtension } from "@warungmeng/module-system";
import { themeManifest } from "./themeManifest";

export function createThemeExtension(): WarungMengExtension {
  return {
    manifest: themeManifest,
    register() {},
  };
}
