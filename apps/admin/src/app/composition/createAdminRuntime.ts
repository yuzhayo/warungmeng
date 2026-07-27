import { createModuleRegistry, type ModuleCandidate } from "@warungmeng/module-system";
import { createAdminModuleCandidates } from "../discovery/adminModuleCandidates";
import { createAdminModuleDiagnostics } from "../discovery/adminModuleDiagnostics";
import { discoverAdminModules } from "../discovery/discoverAdminModules";
import type { AdminRuntime, AdminRuntimeSnapshot } from "./adminRuntime";
import {
  bindAdminRepositories,
  bindUnavailableAdminRepositories,
  type AdminRepositories,
} from "./createAdminRepositories";

export interface CreateAdminRuntimeOptions {
  readonly repositories: AdminRepositories;
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
  const candidates = options.candidates ?? createAdminModuleCandidates(options.repositories);
  const listeners = new Set<() => void>();
  let snapshot = idleSnapshot;
  let operation: Promise<AdminRuntimeSnapshot> | undefined;
  let target: "idle" | "active" = "idle";
  let initialized = false;
  let cleanupBinding: (() => void) | undefined;

  function update(next: AdminRuntimeSnapshot): AdminRuntimeSnapshot {
    snapshot = next;
    for (const listener of listeners) listener();
    return snapshot;
  }

  async function performInitialize(): Promise<AdminRuntimeSnapshot> {
    diagnostics.clear();
    update({ status: "loading", dashboardAvailable: false, diagnostics: [] });
    try {
      const result = await discoverAdminModules(registry, candidates, diagnostics);
      cleanupBinding?.();
      cleanupBinding = result.dashboardRegistered
        ? bindAdminRepositories(options.repositories)
        : bindUnavailableAdminRepositories();
      initialized = true;
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
      cleanupBinding = bindUnavailableAdminRepositories();
      initialized = true;
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
