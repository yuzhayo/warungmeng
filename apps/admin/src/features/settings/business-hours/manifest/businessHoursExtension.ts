import type { WarungMengExtension } from "@warungmeng/module-system";
import { businessHoursManifest } from "./businessHoursManifest";

export function createBusinessHoursExtension(): WarungMengExtension {
  return {
    manifest: businessHoursManifest,
    register() {},
  };
}
