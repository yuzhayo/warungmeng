import type { ModuleCandidate } from "@warungmeng/module-system";
import { createDashboardExtension } from "../../features/dashboard";
import { createFinanceExtension } from "../../features/finance";
import { createInventoryExtension } from "../../features/inventory";
import { createMenuExtension } from "../../features/menu";
import { createOrdersExtension } from "../../features/orders";
import { createPosExtension } from "../../features/pos";
import {
  createBusinessHoursExtension,
  createSettingsExtension,
  createThemeExtension,
} from "../../features/settings";
import type { AdminCapabilities } from "../composition/createAdminCapabilities";
import type { AdminRepositories } from "../composition/createAdminRepositories";

export interface CreateAdminModuleCandidatesOptions {
  readonly repositories: AdminRepositories;
  readonly capabilities: AdminCapabilities;
}

/**
 * Every candidate receives its already-assembled implementations from the one
 * composed capability bundle; extensions only publish what composition built.
 */
export function createAdminModuleCandidates(
  options: CreateAdminModuleCandidatesOptions,
): readonly ModuleCandidate[] {
  const { repositories, capabilities } = options;

  return [
    {
      source: "admin.dashboard",
      load: () => createDashboardExtension(repositories.dashboard),
    },
    {
      source: "admin.menu",
      load: () => createMenuExtension(capabilities.catalog),
    },
    {
      source: "admin.settings",
      load: () => createSettingsExtension(),
    },
    {
      source: "admin.settings.theme",
      load: () => createThemeExtension(),
    },
    {
      source: "admin.settings.business-hours",
      load: () => createBusinessHoursExtension(),
    },
    {
      source: "admin.inventory",
      load: () => createInventoryExtension(capabilities.inventory),
    },
    {
      source: "admin.finance",
      load: () => createFinanceExtension(capabilities.finance),
    },
    {
      source: "admin.pos",
      load: () => createPosExtension(capabilities.pos),
    },
    {
      source: "admin.orders",
      load: () => createOrdersExtension(capabilities.orders),
    },
  ];
}
