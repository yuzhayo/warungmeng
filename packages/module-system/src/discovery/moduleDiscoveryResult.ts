import type { ModuleDiagnostic } from "../contracts/moduleDiagnostic";
import type { ValidatedModuleCandidate } from "./moduleCandidate";

export interface RejectedModuleCandidate {
  readonly source: string;
  readonly diagnostics: readonly ModuleDiagnostic[];
}

export interface ModuleDiscoveryResult {
  readonly valid: readonly ValidatedModuleCandidate[];
  readonly rejected: readonly RejectedModuleCandidate[];
  readonly diagnostics: readonly ModuleDiagnostic[];
}
