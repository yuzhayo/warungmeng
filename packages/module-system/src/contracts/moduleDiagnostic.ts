import type { ModuleId } from "./moduleId";
import type { WarungMengSurface } from "./moduleSurface";

export type ModuleDiagnosticSeverity = "info" | "warning" | "error";

export type ModuleDiagnosticCode =
  | "candidate-load-failed"
  | "manifest-malformed"
  | "duplicate-module-id"
  | "duplicate-contribution-id"
  | "wrong-surface"
  | "unsupported-version"
  | "missing-dependency"
  | "dependency-cycle"
  | "missing-capability"
  | "duplicate-capability"
  | "registration-failed"
  | "disposal-failed";

export interface ModuleDiagnostic {
  readonly code: ModuleDiagnosticCode;
  readonly severity: ModuleDiagnosticSeverity;
  readonly message: string;
  readonly surface: WarungMengSurface;
  readonly moduleId?: ModuleId;
  readonly source?: string;
  readonly details?: Readonly<Record<string, string | number | boolean | null>>;
}

export interface ModuleDiagnosticSink {
  report(diagnostic: ModuleDiagnostic): void;
}
