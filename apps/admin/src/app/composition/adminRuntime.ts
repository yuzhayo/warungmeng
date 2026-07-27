import type {
  ModuleDiagnostic,
  ModuleRegistry,
  WarungMengSurface,
} from "@warungmeng/module-system";
import { createAdminRuntime } from "./createAdminRuntime";
import { createAdminRepositories, type AdminRepositories } from "./createAdminRepositories";

export type AdminRuntimeStatus = "idle" | "loading" | "ready" | "degraded";

export interface AdminRuntimeSnapshot {
  readonly status: AdminRuntimeStatus;
  readonly dashboardAvailable: boolean;
  readonly diagnostics: readonly ModuleDiagnostic[];
}

export interface AdminRuntime {
  readonly surface: Extract<WarungMengSurface, "admin">;
  readonly registry: ModuleRegistry;
  readonly repositories: AdminRepositories;
  initialize(): Promise<AdminRuntimeSnapshot>;
  dispose(): Promise<AdminRuntimeSnapshot>;
  getSnapshot(): AdminRuntimeSnapshot;
  subscribe(listener: () => void): () => void;
}

export const adminRepositories = createAdminRepositories();
export const adminRuntime = createAdminRuntime({ repositories: adminRepositories });
