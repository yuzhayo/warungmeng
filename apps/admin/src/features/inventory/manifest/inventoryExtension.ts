import type { WarungMengExtension } from "@warungmeng/module-system";
import { inventoryManifest } from "./inventoryManifest";

export function createInventoryExtension(): WarungMengExtension {
  return {
    manifest: inventoryManifest,
    register() {},
  };
}
