import type { WarungMengExtension } from "@warungmeng/module-system";
import { settingsManifest } from "./settingsManifest";

export function createSettingsExtension(): WarungMengExtension {
  return {
    manifest: settingsManifest,
    register() {},
  };
}
