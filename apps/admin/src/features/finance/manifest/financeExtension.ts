import { createCapabilityToken, type WarungMengExtension } from "@warungmeng/module-system";
import type {
  FinanceReadCapability,
  FinanceRecordCapability,
  FinanceRefundCapability,
} from "../application/financeCapabilities";
import {
  FINANCE_READ_CAPABILITY_ID,
  FINANCE_RECORD_CAPABILITY_ID,
  FINANCE_REFUND_CAPABILITY_ID,
  financeManifest,
} from "./financeManifest";

export const financeReadCapability = createCapabilityToken<FinanceReadCapability>(
  FINANCE_READ_CAPABILITY_ID,
);
export const financeRecordCapability = createCapabilityToken<FinanceRecordCapability>(
  FINANCE_RECORD_CAPABILITY_ID,
);
export const financeRefundCapability = createCapabilityToken<FinanceRefundCapability>(
  FINANCE_REFUND_CAPABILITY_ID,
);

export interface FinanceExtensionCapabilities {
  readonly read: FinanceReadCapability;
  readonly record: FinanceRecordCapability;
  readonly refund: FinanceRefundCapability;
}

export function createFinanceExtension(
  capabilities: FinanceExtensionCapabilities,
): WarungMengExtension {
  return {
    manifest: financeManifest,
    register(context) {
      context.capabilities.provide(financeReadCapability, capabilities.read);
      context.capabilities.provide(financeRecordCapability, capabilities.record);
      context.capabilities.provide(financeRefundCapability, capabilities.refund);
    },
  };
}
