import type { ModuleActivation, WarungMengExtension } from "../contracts/moduleExtension";
import type { ModuleDiagnostic, ModuleDiagnosticSink } from "../contracts/moduleDiagnostic";
import type { CapabilityId, ModuleId } from "../contracts/moduleId";
import type { WarungMengSurface } from "../contracts/moduleSurface";
import type {
  CapabilityRegistration,
  CapabilityRegistrationResult,
  CapabilityRegistryController,
  CapabilityToken,
  ScopedCapabilityRegistry,
} from "../capabilities/capabilityRegistry";
import type { ModuleRegistrationResult } from "./moduleRegistry";

export interface RegisteredModule {
  readonly extension: WarungMengExtension;
  readonly activation?: ModuleActivation;
  readonly capabilities: readonly CapabilityRegistration[];
}

export interface RegisterModuleInput {
  readonly surface: WarungMengSurface;
  readonly extension: WarungMengExtension;
  readonly capabilities: CapabilityRegistryController;
  readonly diagnostics: ModuleDiagnosticSink;
  readonly rejectionDiagnostics: readonly ModuleDiagnostic[];
}

interface PendingCapability {
  readonly capabilityId: CapabilityId;
  readonly implementation: unknown;
  active: boolean;
  committed?: CapabilityRegistration;
}

function registrationDiagnostic(
  surface: WarungMengSurface,
  moduleId: ModuleId,
  message: string,
): ModuleDiagnostic {
  return {
    code: "registration-failed",
    severity: "error",
    message,
    surface,
    moduleId,
  };
}

function duplicateDiagnostic(
  surface: WarungMengSurface,
  moduleId: ModuleId,
  capabilityId: CapabilityId,
  existingOwnerModuleId: ModuleId,
): ModuleDiagnostic {
  return {
    code: "duplicate-capability",
    severity: "error",
    message: "Capability provider is already registered.",
    surface,
    moduleId,
    details: { capabilityId, existingOwnerModuleId },
  };
}

async function rollback(
  surface: WarungMengSurface,
  moduleId: ModuleId,
  activation: ModuleActivation | undefined,
  registrations: readonly CapabilityRegistration[],
  diagnostics: ModuleDiagnosticSink,
): Promise<void> {
  const disposables = [...(activation ? [activation] : []), ...[...registrations].reverse()];
  for (const disposable of disposables) {
    try {
      await disposable.dispose();
    } catch {
      diagnostics.report({
        code: "disposal-failed",
        severity: "error",
        message: "Module rollback disposal failed.",
        surface,
        moduleId,
      });
    }
  }
}

export async function registerModule(
  input: RegisterModuleInput,
): Promise<{ readonly result: ModuleRegistrationResult; readonly registered?: RegisteredModule }> {
  const { extension } = input;
  if (input.rejectionDiagnostics.length > 0) {
    return {
      result: { status: "rejected", diagnostics: input.rejectionDiagnostics },
    };
  }

  const stagedRegistrations: CapabilityRegistration[] = [];
  const pendingCapabilities = new Map<CapabilityId, PendingCapability>();
  let acceptingCapabilities = true;
  let duplicate: ModuleDiagnostic | undefined;
  const committedScope = input.capabilities.createScope(extension.manifest.id);

  function stageCapability<TContract>(
    token: CapabilityToken<TContract>,
    implementation: TContract,
  ): CapabilityRegistrationResult {
    if (!acceptingCapabilities) {
      const existing = input.capabilities.resolve(token);
      return {
        status: "duplicate",
        capabilityId: token.id,
        existingOwnerModuleId:
          existing.status === "available" ? existing.ownerModuleId : extension.manifest.id,
      };
    }

    const existing = input.capabilities.resolve(token);
    const pending = pendingCapabilities.get(token.id);
    if (existing.status === "available" || pending?.active) {
      const existingOwnerModuleId =
        existing.status === "available" ? existing.ownerModuleId : extension.manifest.id;
      duplicate = duplicateDiagnostic(
        input.surface,
        extension.manifest.id,
        token.id,
        existingOwnerModuleId,
      );
      return {
        status: "duplicate",
        capabilityId: token.id,
        existingOwnerModuleId,
      };
    }

    const record: PendingCapability = {
      capabilityId: token.id,
      implementation,
      active: true,
    };
    pendingCapabilities.set(token.id, record);
    const registration: CapabilityRegistration = {
      capabilityId: token.id,
      async dispose() {
        if (!record.active) {
          return;
        }
        record.active = false;
        pendingCapabilities.delete(token.id);
        await record.committed?.dispose();
      },
    };
    stagedRegistrations.push(registration);
    return { status: "registered", registration };
  }

  const scope: ScopedCapabilityRegistry = {
    resolve<TContract>(token: CapabilityToken<TContract>) {
      const pending = pendingCapabilities.get(token.id);
      if (pending?.active && !pending.committed) {
        return {
          status: "available" as const,
          ownerModuleId: extension.manifest.id,
          value: pending.implementation as TContract,
        };
      }
      return input.capabilities.resolve(token);
    },
    provide: stageCapability,
  };

  let activation: ModuleActivation | undefined;
  try {
    const registered = await extension.register({
      moduleId: extension.manifest.id,
      surface: input.surface,
      capabilities: scope,
      diagnostics: input.diagnostics,
    });
    activation = registered ?? undefined;
    acceptingCapabilities = false;

    if (duplicate) {
      pendingCapabilities.clear();
      await rollback(
        input.surface,
        extension.manifest.id,
        activation,
        stagedRegistrations,
        input.diagnostics,
      );
      return { result: { status: "rejected", diagnostics: [duplicate] } };
    }

    const declaredCapabilityIds = new Set((extension.manifest.provides ?? []).map(({ id }) => id));
    const activePending = [...pendingCapabilities.values()].filter(({ active }) => active);
    const undeclaredRegistration = activePending.find(
      ({ capabilityId }) => !declaredCapabilityIds.has(capabilityId),
    );
    const missingDeclaration = (extension.manifest.provides ?? []).find(
      ({ id }) => !pendingCapabilities.get(id)?.active,
    );
    if (undeclaredRegistration || missingDeclaration) {
      pendingCapabilities.clear();
      const diagnostic = registrationDiagnostic(
        input.surface,
        extension.manifest.id,
        undeclaredRegistration
          ? "Module registered an undeclared capability."
          : "Module did not register a declared capability.",
      );
      await rollback(
        input.surface,
        extension.manifest.id,
        activation,
        stagedRegistrations,
        input.diagnostics,
      );
      return { result: { status: "failed", diagnostics: [diagnostic] } };
    }

    for (const pending of activePending) {
      const result = committedScope.provide(
        { id: pending.capabilityId, version: 1 },
        pending.implementation,
      );
      if (result.status === "duplicate") {
        const diagnostic = duplicateDiagnostic(
          input.surface,
          extension.manifest.id,
          result.capabilityId,
          result.existingOwnerModuleId,
        );
        await rollback(
          input.surface,
          extension.manifest.id,
          activation,
          stagedRegistrations,
          input.diagnostics,
        );
        pendingCapabilities.clear();
        return { result: { status: "rejected", diagnostics: [diagnostic] } };
      }
      pending.committed = result.registration;
    }

    return {
      result: { status: "registered", manifest: extension.manifest },
      registered: {
        extension,
        activation,
        capabilities: stagedRegistrations,
      },
    };
  } catch {
    acceptingCapabilities = false;
    pendingCapabilities.clear();
    const diagnostic = registrationDiagnostic(
      input.surface,
      extension.manifest.id,
      "Module registration failed.",
    );
    await rollback(
      input.surface,
      extension.manifest.id,
      activation,
      stagedRegistrations,
      input.diagnostics,
    );
    return { result: { status: "failed", diagnostics: [diagnostic] } };
  }
}

export async function disposeRegisteredModule(
  module: RegisteredModule,
  surface: WarungMengSurface,
  diagnostics: ModuleDiagnosticSink,
): Promise<void> {
  await rollback(
    surface,
    module.extension.manifest.id,
    module.activation,
    module.capabilities,
    diagnostics,
  );
}
