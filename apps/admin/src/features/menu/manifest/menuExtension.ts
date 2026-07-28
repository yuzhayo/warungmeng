import { createCapabilityToken, type WarungMengExtension } from "@warungmeng/module-system";
import type { CatalogReadCapability } from "../application/catalogReadCapability";
import { CATALOG_READ_CAPABILITY_ID, menuManifest } from "./menuManifest";

export const catalogReadCapability = createCapabilityToken<CatalogReadCapability>(
  CATALOG_READ_CAPABILITY_ID,
);

/**
 * Menu participates in Phase 04 as catalog read support only: it publishes
 * the composition-assembled `catalog.read` implementation. Menu screens
 * themselves stay on their existing compatibility path.
 */
export function createMenuExtension(catalog: CatalogReadCapability): WarungMengExtension {
  return {
    manifest: menuManifest,
    register({ capabilities }) {
      capabilities.provide(catalogReadCapability, catalog);
    },
  };
}
