import { createCapabilityToken, type WarungMengExtension } from "@warungmeng/module-system";
import type {
  OrdersManageCapability,
  OrdersReadCapability,
} from "../application/ordersCapabilities";
import {
  ORDERS_MANAGE_CAPABILITY_ID,
  ORDERS_READ_CAPABILITY_ID,
  ordersManifest,
} from "./ordersManifest";

export const ordersReadCapability =
  createCapabilityToken<OrdersReadCapability>(ORDERS_READ_CAPABILITY_ID);
export const ordersManageCapability = createCapabilityToken<OrdersManageCapability>(
  ORDERS_MANAGE_CAPABILITY_ID,
);

export interface OrdersExtensionCapabilities {
  readonly read: OrdersReadCapability;
  readonly manage: OrdersManageCapability;
}

export function createOrdersExtension(
  capabilities: OrdersExtensionCapabilities,
): WarungMengExtension {
  return {
    manifest: ordersManifest,
    register(context) {
      context.capabilities.provide(ordersReadCapability, capabilities.read);
      context.capabilities.provide(ordersManageCapability, capabilities.manage);
    },
  };
}
