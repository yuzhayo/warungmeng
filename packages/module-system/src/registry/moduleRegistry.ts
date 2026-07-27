import type { WarungMengExtension } from "../contracts/moduleExtension";
import type { ModuleDiagnostic } from "../contracts/moduleDiagnostic";
import type { ModuleId } from "../contracts/moduleId";
import type { WarungMengModuleManifest } from "../contracts/moduleManifest";
import type { WarungMengSurface } from "../contracts/moduleSurface";

export type ModuleRegistrationResult =
  | {
      readonly status: "registered";
      readonly manifest: WarungMengModuleManifest;
    }
  | {
      readonly status: "rejected";
      readonly diagnostics: readonly ModuleDiagnostic[];
    }
  | {
      readonly status: "failed";
      readonly diagnostics: readonly ModuleDiagnostic[];
    };

export interface ModuleRegistry {
  readonly surface: WarungMengSurface;

  register(extension: WarungMengExtension): Promise<ModuleRegistrationResult>;

  registerAll(
    extensions: readonly WarungMengExtension[],
  ): Promise<readonly ModuleRegistrationResult[]>;

  resolve(moduleId: ModuleId): WarungMengModuleManifest | undefined;

  list(): readonly WarungMengModuleManifest[];

  dispose(moduleId: ModuleId): Promise<void>;

  disposeAll(): Promise<void>;
}
