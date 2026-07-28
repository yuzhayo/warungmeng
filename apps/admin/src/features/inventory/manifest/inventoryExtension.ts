import { createCapabilityToken, type WarungMengExtension } from "@warungmeng/module-system";
import type {
  InventoryAdjustCapability,
  InventoryConsumeCapability,
  InventoryReadCapability,
  InventoryReverseCapability,
} from "../application/inventoryCapabilities";
import {
  INVENTORY_ADJUST_CAPABILITY_ID,
  INVENTORY_CONSUME_CAPABILITY_ID,
  INVENTORY_READ_CAPABILITY_ID,
  INVENTORY_REVERSE_CAPABILITY_ID,
  inventoryManifest,
} from "./inventoryManifest";

export const inventoryReadCapability = createCapabilityToken<InventoryReadCapability>(
  INVENTORY_READ_CAPABILITY_ID,
);
export const inventoryAdjustCapability = createCapabilityToken<InventoryAdjustCapability>(
  INVENTORY_ADJUST_CAPABILITY_ID,
);
export const inventoryConsumeCapability = createCapabilityToken<InventoryConsumeCapability>(
  INVENTORY_CONSUME_CAPABILITY_ID,
);
export const inventoryReverseCapability = createCapabilityToken<InventoryReverseCapability>(
  INVENTORY_REVERSE_CAPABILITY_ID,
);

export interface InventoryExtensionCapabilities {
  readonly read: InventoryReadCapability;
  readonly adjust: InventoryAdjustCapability;
  readonly consume: InventoryConsumeCapability;
  readonly reverse: InventoryReverseCapability;
}

export function createInventoryExtension(
  capabilities: InventoryExtensionCapabilities,
): WarungMengExtension {
  return {
    manifest: inventoryManifest,
    register(context) {
      context.capabilities.provide(inventoryReadCapability, capabilities.read);
      context.capabilities.provide(inventoryAdjustCapability, capabilities.adjust);
      context.capabilities.provide(inventoryConsumeCapability, capabilities.consume);
      context.capabilities.provide(inventoryReverseCapability, capabilities.reverse);
    },
  };
}
