import type { ScopedCapabilityRegistry } from "../capabilities/capabilityRegistry";
import type { ModuleDiagnosticSink } from "./moduleDiagnostic";
import type { ModuleId } from "./moduleId";
import type { WarungMengModuleManifest } from "./moduleManifest";
import type { WarungMengSurface } from "./moduleSurface";

export interface ModuleActivation {
  dispose(): void | Promise<void>;
}

export interface WarungMengExtensionContext {
  readonly moduleId: ModuleId;
  readonly surface: WarungMengSurface;
  readonly capabilities: ScopedCapabilityRegistry;
  readonly diagnostics: ModuleDiagnosticSink;
}

export interface WarungMengExtension {
  readonly manifest: WarungMengModuleManifest;
  register(
    context: WarungMengExtensionContext,
  ): void | ModuleActivation | Promise<void | ModuleActivation>;
}
