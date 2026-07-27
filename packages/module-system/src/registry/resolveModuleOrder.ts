import type { WarungMengModuleManifest } from "../contracts/moduleManifest";
import type { ModuleGraphValidationResult } from "./validateModuleGraph";
import { validateModuleGraph } from "./validateModuleGraph";

export function resolveModuleOrder(
  manifests: readonly WarungMengModuleManifest[],
): ModuleGraphValidationResult {
  if (manifests.length === 0) {
    return { status: "valid", orderedModuleIds: [] };
  }

  return validateModuleGraph(manifests[0]!.surface, manifests);
}
