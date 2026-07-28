import type { WarungMengExtension } from "@warungmeng/module-system";
import { menuManifest } from "./menuManifest";

/**
 * Phase 03 owns declarative metadata. Capability wiring remains deliberately
 * empty until Phase 04 injects the feature ports.
 */
export function createMenuExtension(): WarungMengExtension {
  return {
    manifest: menuManifest,
    register() {},
  };
}
