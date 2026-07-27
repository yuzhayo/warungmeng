import type { ModuleCandidate } from "@warungmeng/module-system";
import { createDashboardExtension } from "../../features/dashboard";
import type { AdminRepositories } from "../composition/createAdminRepositories";

export function createAdminModuleCandidates(
  repositories: AdminRepositories,
): readonly ModuleCandidate[] {
  return [
    {
      source: "admin.dashboard",
      load: () => createDashboardExtension(repositories.dashboard),
    },
  ];
}
