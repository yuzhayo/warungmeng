import { createModuleRegistry, type ModuleCandidate } from "@warungmeng/module-system";
import { FINANCE_MODULE_ID } from "../../features/finance";
import { INVENTORY_MODULE_ID } from "../../features/inventory";
import { MENU_MODULE_ID } from "../../features/menu";
import { ORDERS_MODULE_ID } from "../../features/orders";
import { POS_MODULE_ID } from "../../features/pos";
import { createAdminModuleCandidates } from "../discovery/adminModuleCandidates";
import { createAdminModuleDiagnostics } from "../discovery/adminModuleDiagnostics";
import { discoverAdminModules } from "../discovery/discoverAdminModules";
import type { AdminRuntime, AdminRuntimeCapabilities, AdminRuntimeSnapshot } from "./adminRuntime";
import { createAdminCapabilities, type AdminCapabilities } from "./createAdminCapabilities";
import {
  bindAdminRepositories,
  bindUnavailableAdminRepositories,
  type AdminRepositories,
} from "./createAdminRepositories";
import { createAdminStorageAdapters } from "./createAdminStorageAdapters";

export interface CreateAdminRuntimeOptions {
  readonly repositories: AdminRepositories;
  /** Defaults to a bundle assembled over these repositories and browser storage. */
  readonly capabilities?: AdminCapabilities;
  readonly candidates?: readonly ModuleCandidate[];
}

const idleSnapshot: AdminRuntimeSnapshot = {
  status: "idle",
  dashboardAvailable: false,
  diagnostics: [],
};

export function createAdminRuntime(options: CreateAdminRuntimeOptions): AdminRuntime {
  const diagnostics = createAdminModuleDiagnostics();
  const registry = createModuleRegistry({ surface: "admin", diagnostics });
  const capabilities =
    options.capabilities ??
    createAdminCapabilities({
      repositories: options.repositories,
      storage: createAdminStorageAdapters(),
    });
  const candidates =
    options.candidates ??
    createAdminModuleCandidates({
      repositories: options.repositories,
      capabilities,
    });
  const listeners = new Set<() => void>();
  let snapshot = idleSnapshot;
  let activeCapabilities: AdminRuntimeCapabilities = {};
  let operation: Promise<AdminRuntimeSnapshot> | undefined;
  let target: "idle" | "active" = "idle";
  let initialized = false;
  let cleanupBinding: (() => void) | undefined;

  function update(next: AdminRuntimeSnapshot): AdminRuntimeSnapshot {
    snapshot = next;
    for (const listener of listeners) listener();
    return snapshot;
  }

  /**
   * A module's capability slice is only exposed while that module is actually
   * registered, so a failed registration (whose capabilities were rolled
   * back) never leaks stale implementations to route adapters.
   */
  function resolveActiveCapabilities(): AdminRuntimeCapabilities {
    return {
      ...(registry.resolve(MENU_MODULE_ID) ? { catalog: capabilities.catalog } : {}),
      ...(registry.resolve(ORDERS_MODULE_ID) ? { orders: capabilities.orders } : {}),
      ...(registry.resolve(INVENTORY_MODULE_ID) ? { inventory: capabilities.inventory } : {}),
      ...(registry.resolve(FINANCE_MODULE_ID) ? { finance: capabilities.finance } : {}),
      ...(registry.resolve(POS_MODULE_ID) ? { pos: capabilities.pos } : {}),
    };
  }

  async function performInitialize(): Promise<AdminRuntimeSnapshot> {
    diagnostics.clear();
    update({ status: "loading", dashboardAvailable: false, diagnostics: [] });
    try {
      const result = await discoverAdminModules(registry, candidates, diagnostics);
      cleanupBinding?.();
      cleanupBinding = result.dashboardRegistered
        ? bindAdminRepositories(options.repositories)
        : bindUnavailableAdminRepositories(options.repositories);
      initialized = true;
      activeCapabilities = resolveActiveCapabilities();
      return update({
        status: result.dashboardRegistered ? "ready" : "degraded",
        dashboardAvailable: result.dashboardRegistered,
        diagnostics: diagnostics.list(),
      });
    } catch {
      diagnostics.report({
        code: "registration-failed",
        severity: "error",
        message: "Required Admin module startup failed.",
        surface: "admin",
        moduleId: "admin.dashboard",
      });
      cleanupBinding?.();
      cleanupBinding = bindUnavailableAdminRepositories(options.repositories);
      initialized = true;
      activeCapabilities = resolveActiveCapabilities();
      return update({
        status: "degraded",
        dashboardAvailable: false,
        diagnostics: diagnostics.list(),
      });
    }
  }

  async function performDispose(): Promise<AdminRuntimeSnapshot> {
    cleanupBinding?.();
    cleanupBinding = undefined;
    await registry.disposeAll();
    initialized = false;
    activeCapabilities = {};
    return update(idleSnapshot);
  }

  async function reconcile(): Promise<AdminRuntimeSnapshot> {
    while (true) {
      if (target === "active") {
        if (initialized) return snapshot;
        await performInitialize();
      } else {
        if (!initialized && registry.list().length === 0) return snapshot;
        await performDispose();
      }
    }
  }

  function startReconciliation(): Promise<AdminRuntimeSnapshot> {
    if (operation) return operation;
    const pending = reconcile();
    operation = pending;
    void pending.finally(() => {
      if (operation === pending) operation = undefined;
    });
    return pending;
  }

  return {
    surface: "admin",
    registry,
    repositories: options.repositories,
    get capabilities() {
      return activeCapabilities;
    },
    initialize() {
      target = "active";
      return startReconciliation();
    },
    dispose() {
      target = "idle";
      return startReconciliation();
    },
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
