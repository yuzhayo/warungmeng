export {
  createInventoryExtension,
  type InventoryExtensionCapabilities,
} from "./manifest/inventoryExtension";
export type {
  InventoryAdjustCapability,
  InventoryConsumeCapability,
  InventoryReadCapability,
  InventoryReverseCapability,
} from "./application/inventoryCapabilities";
export type { InventoryCatalogReadPort } from "./application/ports/catalogReadPort";
export {
  INVENTORY_MODULE_ID,
  INVENTORY_READ_CAPABILITY_ID,
  INVENTORY_ADJUST_CAPABILITY_ID,
  INVENTORY_CONSUME_CAPABILITY_ID,
  INVENTORY_REVERSE_CAPABILITY_ID,
  INVENTORY_NAV_ID,
  INVENTORY_ROUTE_ROOT_ID,
  INVENTORY_ROUTE_MATERIALS_ID,
  INVENTORY_ROUTE_MOVEMENTS_ID,
  INVENTORY_ROUTE_HPP_ID,
  INVENTORY_REDIRECT_CALCULATOR_ID,
  inventoryManifest,
} from "./manifest/inventoryManifest";
