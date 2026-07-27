import type { WarungMengExtension } from "../contracts/moduleExtension";
import type { ModuleDiagnostic } from "../contracts/moduleDiagnostic";
import type { WarungMengSurface } from "../contracts/moduleSurface";
import { validateManifestShape } from "../registry/validateModuleGraph";
import type { ModuleCandidate } from "./moduleCandidate";
import type { ModuleDiscoveryResult } from "./moduleDiscoveryResult";

function isExtension(value: unknown): value is WarungMengExtension {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<WarungMengExtension>;
  return typeof candidate.register === "function" && candidate.manifest !== undefined;
}

export async function discoverModuleCandidates(
  surface: WarungMengSurface,
  candidates: readonly ModuleCandidate[],
): Promise<ModuleDiscoveryResult> {
  const valid: ModuleDiscoveryResult["valid"][number][] = [];
  const rejected: ModuleDiscoveryResult["rejected"][number][] = [];
  const diagnostics: ModuleDiagnostic[] = [];

  for (const candidate of candidates) {
    let loaded: unknown;
    try {
      loaded = await candidate.load();
    } catch {
      const diagnostic: ModuleDiagnostic = {
        code: "candidate-load-failed",
        severity: "error",
        message: "Module candidate could not be loaded.",
        surface,
        source: candidate.source,
      };
      diagnostics.push(diagnostic);
      rejected.push({ source: candidate.source, diagnostics: [diagnostic] });
      continue;
    }

    if (!isExtension(loaded)) {
      const diagnostic: ModuleDiagnostic = {
        code: "manifest-malformed",
        severity: "error",
        message: "Module candidate does not expose a valid extension contract.",
        surface,
        source: candidate.source,
      };
      diagnostics.push(diagnostic);
      rejected.push({ source: candidate.source, diagnostics: [diagnostic] });
      continue;
    }

    const candidateDiagnostics = validateManifestShape(surface, loaded.manifest, candidate.source);
    if (candidateDiagnostics.length > 0) {
      diagnostics.push(...candidateDiagnostics);
      rejected.push({ source: candidate.source, diagnostics: candidateDiagnostics });
      continue;
    }

    valid.push({ source: candidate.source, extension: loaded });
  }

  return { valid, rejected, diagnostics };
}
