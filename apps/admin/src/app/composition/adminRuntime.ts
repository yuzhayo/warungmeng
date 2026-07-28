import type {
  ModuleDiagnostic,
  ModuleRegistry,
  WarungMengSurface,
} from "@warungmeng/module-system";
import { createAdminRuntime } from "./createAdminRuntime";
import { createAdminCapabilities, type AdminCapabilities } from "./createAdminCapabilities";
import { createAdminRepositories, type AdminRepositories } from "./createAdminRepositories";
import { createAdminStorageAdapters } from "./createAdminStorageAdapters";

export type AdminRuntimeStatus = "idle" | "loading" | "ready" | "degraded";

export interface AdminRuntimeSnapshot {
  readonly status: AdminRuntimeStatus;
  readonly dashboardAvailable: boolean;
  readonly diagnostics: readonly ModuleDiagnostic[];
}

/**
 * Per-module capability slices. A slice is present only while its owning
 * module is registered; route adapters must treat an absent slice as an
 * explicit unavailable state instead of reaching for another instance.
 */
export interface AdminRuntimeCapabilities {
  readonly catalog?: AdminCapabilities["catalog"];
  readonly orders?: AdminCapabilities["orders"];
  readonly inventory?: AdminCapabilities["inventory"];
  readonly finance?: AdminCapabilities["finance"];
  readonly pos?: AdminCapabilities["pos"];
}

export interface AdminRuntime {
  readonly surface: Extract<WarungMengSurface, "admin">;
  readonly registry: ModuleRegistry;
  readonly repositories: AdminRepositories;
  readonly capabilities: AdminRuntimeCapabilities;
  initialize(): Promise<AdminRuntimeSnapshot>;
  dispose(): Promise<AdminRuntimeSnapshot>;
  getSnapshot(): AdminRuntimeSnapshot;
  subscribe(listener: () => void): () => void;
}

export const adminRepositories = createAdminRepositories();
export const adminCapabilities = createAdminCapabilities({
  repositories: adminRepositories,
  storage: createAdminStorageAdapters(),
});
export const adminRuntime = createAdminRuntime({
  repositories: adminRepositories,
  capabilities: adminCapabilities,
});
