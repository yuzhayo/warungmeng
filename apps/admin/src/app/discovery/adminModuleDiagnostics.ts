import type { ModuleDiagnostic, ModuleDiagnosticSink } from "@warungmeng/module-system";

export interface AdminModuleDiagnostics extends ModuleDiagnosticSink {
  list(): readonly ModuleDiagnostic[];
  clear(): void;
}

export function createAdminModuleDiagnostics(): AdminModuleDiagnostics {
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
