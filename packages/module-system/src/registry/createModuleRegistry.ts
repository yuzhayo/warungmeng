import type { CapabilityRegistryController } from "../capabilities/capabilityRegistry";
import { createCapabilityRegistry } from "../capabilities/createCapabilityRegistry";
import type { ModuleId } from "../contracts/moduleId";
import type { WarungMengExtension } from "../contracts/moduleExtension";
import type { ModuleDiagnostic, ModuleDiagnosticSink } from "../contracts/moduleDiagnostic";
import type { WarungMengModuleManifest } from "../contracts/moduleManifest";
import type { WarungMengSurface } from "../contracts/moduleSurface";
import type { ModuleRegistry, ModuleRegistrationResult } from "./moduleRegistry";
import { disposeRegisteredModule, registerModule, type RegisteredModule } from "./registerModule";
import { resolveModuleOrder } from "./resolveModuleOrder";
import { validateModuleGraph, validateManifestShape } from "./validateModuleGraph";

export interface CreateModuleRegistryOptions {
  readonly surface: WarungMengSurface;
  readonly diagnostics?: ModuleDiagnosticSink;
}

function collectRequiredCapabilityDiagnostics(
  surface: WarungMengSurface,
  extension: WarungMengExtension,
  capabilities: CapabilityRegistryController,
): readonly ModuleDiagnostic[] {
  return (extension.manifest.requires ?? [])
    .filter(
      ({ id, optional }) =>
        !optional && capabilities.resolve({ id, version: 1 }).status === "missing",
    )
    .map(({ id }) => ({
      code: "missing-capability" as const,
      severity: "error" as const,
      message: "Required capability is not active.",
      surface,
      moduleId: extension.manifest.id,
      details: { capabilityId: id },
    }));
}

export function createModuleRegistry(options: CreateModuleRegistryOptions): ModuleRegistry {
  const registered = new Map<ModuleId, RegisteredModule>();
  const registrationOrder: ModuleId[] = [];
  const capabilities = createCapabilityRegistry();
  const diagnostics = options.diagnostics ?? { report() {} };
  let mutationQueue: Promise<void> = Promise.resolve();

  function enqueueMutation<TResult>(operation: () => Promise<TResult>): Promise<TResult> {
    const result = mutationQueue.then(operation, operation);
    mutationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async function performRegister(
    extension: WarungMengExtension,
  ): Promise<ModuleRegistrationResult> {
    const shapeDiagnostics = validateManifestShape(options.surface, extension.manifest);
    const graphResult = validateModuleGraph(options.surface, [
      ...[...registered.values()].map(({ extension: current }) => current.manifest),
      extension.manifest,
    ]);
    const graphDiagnostics = graphResult.status === "invalid" ? graphResult.diagnostics : [];
    const capabilityDiagnostics = shapeDiagnostics.some(({ code }) => code === "manifest-malformed")
      ? []
      : collectRequiredCapabilityDiagnostics(options.surface, extension, capabilities);
    const rejectionDiagnostics = [
      ...shapeDiagnostics,
      ...graphDiagnostics,
      ...capabilityDiagnostics,
    ].filter(
      (candidate, index, all) =>
        all.findIndex(
          (diagnostic) =>
            diagnostic.code === candidate.code &&
            diagnostic.moduleId === candidate.moduleId &&
            JSON.stringify(diagnostic.details) === JSON.stringify(candidate.details),
        ) === index,
    );

    const attempt = await registerModule({
      surface: options.surface,
      extension,
      capabilities,
      diagnostics,
      rejectionDiagnostics,
    });
    for (const diagnostic of attempt.result.status === "registered"
      ? []
      : attempt.result.diagnostics) {
      diagnostics.report(diagnostic);
    }
    if (attempt.registered) {
      registered.set(extension.manifest.id, attempt.registered);
      registrationOrder.push(extension.manifest.id);
    }
    return attempt.result;
  }

  async function performRegisterAll(
    extensions: readonly WarungMengExtension[],
  ): Promise<readonly ModuleRegistrationResult[]> {
    const existingManifests = [...registered.values()].map(({ extension }) => extension.manifest);
    const graph = resolveModuleOrder([
      ...existingManifests,
      ...extensions.map(({ manifest }) => manifest),
    ]);
    if (graph.status === "invalid") {
      for (const diagnostic of graph.diagnostics) {
        diagnostics.report(diagnostic);
      }
      return extensions.map(() => ({
        status: "rejected" as const,
        diagnostics: graph.diagnostics,
      }));
    }

    const byId = new Map(extensions.map((extension) => [extension.manifest.id, extension]));
    const results = new Map<ModuleId, ModuleRegistrationResult>();
    for (const moduleId of graph.orderedModuleIds) {
      const extension = byId.get(moduleId);
      if (extension && !registered.has(moduleId)) {
        results.set(moduleId, await performRegister(extension));
      }
    }
    return extensions.map(
      ({ manifest }) =>
        results.get(manifest.id) ?? {
          status: "rejected" as const,
          diagnostics: [] as const,
        },
    );
  }

  async function performDispose(moduleId: ModuleId): Promise<void> {
    const module = registered.get(moduleId);
    if (!module) {
      return;
    }
    await disposeRegisteredModule(module, options.surface, diagnostics);
    registered.delete(moduleId);
    const orderIndex = registrationOrder.indexOf(moduleId);
    if (orderIndex >= 0) {
      registrationOrder.splice(orderIndex, 1);
    }
  }

  async function performDisposeAll(): Promise<void> {
    for (const moduleId of [...registrationOrder].reverse()) {
      await performDispose(moduleId);
    }
  }

  return {
    surface: options.surface,
    register(extension) {
      return enqueueMutation(() => performRegister(extension));
    },
    registerAll(extensions) {
      return enqueueMutation(() => performRegisterAll(extensions));
    },
    resolve(moduleId) {
      return registered.get(moduleId)?.extension.manifest;
    },
    list(): readonly WarungMengModuleManifest[] {
      return registrationOrder
        .map((moduleId) => registered.get(moduleId)?.extension.manifest)
        .filter((manifest): manifest is WarungMengModuleManifest => manifest !== undefined);
    },
    dispose(moduleId) {
      return enqueueMutation(() => performDispose(moduleId));
    },
    disposeAll() {
      return enqueueMutation(performDisposeAll);
    },
  };
}
