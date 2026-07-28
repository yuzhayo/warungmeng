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
import type { AdminRepositories } from "../composition/createAdminRepositories";

export function createAdminModuleCandidates(
  repositories: AdminRepositories,
): readonly ModuleCandidate[] {
  return [
    {
      source: "admin.dashboard",
      load: () => createDashboardExtension(repositories.dashboard),
    },
    {
      source: "admin.menu",
      load: () => createMenuExtension(),
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
      load: () => createInventoryExtension(),
    },
    {
      source: "admin.finance",
      load: () => createFinanceExtension(),
    },
    {
      source: "admin.pos",
      load: () => createPosExtension(),
    },
    {
      source: "admin.orders",
      load: () => createOrdersExtension(),
    },
  ];
}
