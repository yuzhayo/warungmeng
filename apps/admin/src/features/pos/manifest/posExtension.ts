import { createCapabilityToken, type WarungMengExtension } from "@warungmeng/module-system";
import type {
  PosCartCapability,
  PosCheckoutCapability,
  PosSessionCapability,
} from "../application/posCapabilities";
import {
  POS_CART_CAPABILITY_ID,
  POS_CHECKOUT_CAPABILITY_ID,
  POS_SESSION_CAPABILITY_ID,
  posManifest,
} from "./posManifest";

export const posSessionCapability =
  createCapabilityToken<PosSessionCapability>(POS_SESSION_CAPABILITY_ID);
export const posCartCapability = createCapabilityToken<PosCartCapability>(POS_CART_CAPABILITY_ID);
export const posCheckoutCapability = createCapabilityToken<PosCheckoutCapability>(
  POS_CHECKOUT_CAPABILITY_ID,
);

export interface PosExtensionCapabilities {
  readonly session: PosSessionCapability;
  readonly cart: PosCartCapability;
  readonly checkout: PosCheckoutCapability;
}

export function createPosExtension(capabilities: PosExtensionCapabilities): WarungMengExtension {
  return {
    manifest: posManifest,
    register(context) {
      context.capabilities.provide(posSessionCapability, capabilities.session);
      context.capabilities.provide(posCartCapability, capabilities.cart);
      context.capabilities.provide(posCheckoutCapability, capabilities.checkout);
    },
  };
}
