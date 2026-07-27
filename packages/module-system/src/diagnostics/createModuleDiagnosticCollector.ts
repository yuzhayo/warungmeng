import type { ModuleDiagnostic, ModuleDiagnosticSink } from "../contracts/moduleDiagnostic";

export interface ModuleDiagnosticCollector extends ModuleDiagnosticSink {
  list(): readonly ModuleDiagnostic[];
  clear(): void;
}

export function createModuleDiagnosticCollector(): ModuleDiagnosticCollector {
  const diagnostics: ModuleDiagnostic[] = [];

  return {
    report(diagnostic) {
      diagnostics.push(diagnostic);
    },
    list() {
      return [...diagnostics];
    },
    clear() {
      diagnostics.length = 0;
    },
  };
}
