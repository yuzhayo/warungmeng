import type { WarungMengModuleManifest } from "@warungmeng/module-system";
import { dashboardManifest } from "../../features/dashboard";
import { financeManifest } from "../../features/finance";
import { inventoryManifest } from "../../features/inventory";
import { menuManifest } from "../../features/menu";
import { ordersManifest } from "../../features/orders";
import { posManifest } from "../../features/pos";
import { businessHoursManifest, settingsManifest, themeManifest } from "../../features/settings";

/**
 * Built-in manifests are the single declarative source for the bundled Admin
 * modules. Registered runtime manifests take precedence; a missing candidate
 * falls back to its bundled manifest so the shell and unaffected routes remain
 * available during degraded startup.
 */
export const adminBuiltInManifests: readonly WarungMengModuleManifest[] = [
  dashboardManifest,
  menuManifest,
  settingsManifest,
  themeManifest,
  businessHoursManifest,
  inventoryManifest,
  financeManifest,
  posManifest,
  ordersManifest,
];

export interface AdminManifestSet {
  readonly manifests: readonly WarungMengModuleManifest[];
  readonly fallbackModuleIds: ReadonlySet<string>;
}

export function resolveAdminManifestSet(
  registered: readonly WarungMengModuleManifest[],
): AdminManifestSet {
  const registeredById = new Map(registered.map((manifest) => [manifest.id, manifest]));
  const fallbackModuleIds = new Set<string>();
  const manifests = adminBuiltInManifests.map((manifest) => {
    const active = registeredById.get(manifest.id);
    if (active) return active;
    fallbackModuleIds.add(manifest.id);
    return manifest;
  });
  const builtInIds = new Set(adminBuiltInManifests.map(({ id }) => id));
  const external = registered
    .filter(({ id }) => !builtInIds.has(id))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    manifests: [...manifests, ...external],
    fallbackModuleIds,
  };
}
