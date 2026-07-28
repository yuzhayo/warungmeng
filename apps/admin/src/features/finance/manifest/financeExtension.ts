import type { WarungMengExtension } from "@warungmeng/module-system";
import { financeManifest } from "./financeManifest";

export function createFinanceExtension(): WarungMengExtension {
  return {
    manifest: financeManifest,
    register() {},
  };
}
