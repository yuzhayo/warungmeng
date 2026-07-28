import type { WarungMengExtension } from "@warungmeng/module-system";
import { ordersManifest } from "./ordersManifest";

export function createOrdersExtension(): WarungMengExtension {
  return {
    manifest: ordersManifest,
    register() {},
  };
}
