import type { WarungMengExtension } from "@warungmeng/module-system";
import { posManifest } from "./posManifest";

export function createPosExtension(): WarungMengExtension {
  return {
    manifest: posManifest,
    register() {},
  };
}
