import {
  discoverModuleCandidates,
  type ModuleCandidate,
  type ModuleDiagnostic,
  type ModuleDiagnosticSink,
  type ModuleRegistry,
} from "@warungmeng/module-system";

export interface AdminModuleDiscoveryResult {
  readonly diagnostics: readonly ModuleDiagnostic[];
  readonly dashboardRegistered: boolean;
}

export async function discoverAdminModules(
  registry: ModuleRegistry,
  candidates: readonly ModuleCandidate[],
  diagnosticSink?: ModuleDiagnosticSink,
): Promise<AdminModuleDiscoveryResult> {
  if (registry.surface !== "admin") {
    throw new Error("Admin module discovery requires an admin registry.");
  }

  const discovery = await discoverModuleCandidates("admin", candidates);
  const registrationResults = await registry.registerAll(
    discovery.valid.map(({ extension }) => extension),
  );
  const registrationDiagnostics = registrationResults.flatMap((result) =>
    result.status === "registered" ? [] : result.diagnostics,
  );
  const diagnostics = [...discovery.diagnostics, ...registrationDiagnostics];
  for (const diagnostic of discovery.diagnostics) {
    diagnosticSink?.report(diagnostic);
  }

  return {
    diagnostics,
    dashboardRegistered: registry.resolve("admin.dashboard") !== undefined,
  };
}
