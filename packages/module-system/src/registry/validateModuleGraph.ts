import type { ModuleDiagnostic } from "../contracts/moduleDiagnostic";
import type { CapabilityId, ContributionId, ModuleId } from "../contracts/moduleId";
import type { WarungMengModuleManifest } from "../contracts/moduleManifest";
import { MODULE_SURFACES, type WarungMengSurface } from "../contracts/moduleSurface";

export type ModuleGraphValidationResult =
  | {
      readonly status: "valid";
      readonly orderedModuleIds: readonly ModuleId[];
    }
  | {
      readonly status: "invalid";
      readonly diagnostics: readonly ModuleDiagnostic[];
    };

function diagnostic(
  surface: WarungMengSurface,
  code: ModuleDiagnostic["code"],
  message: string,
  moduleId?: ModuleId,
  details?: ModuleDiagnostic["details"],
): ModuleDiagnostic {
  return { code, severity: "error", message, surface, moduleId, details };
}

function isSurface(value: unknown): value is WarungMengSurface {
  return typeof value === "string" && MODULE_SURFACES.some((surface) => surface === value);
}

function isModuleId(value: unknown): value is ModuleId {
  return (
    typeof value === "string" && /^(admin|storefront)\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(value)
  );
}

function isNamespacedId(value: unknown): value is `${string}.${string}` {
  return typeof value === "string" && /^[^.]+\..+$/.test(value);
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === "boolean";
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isDependency(value: unknown): boolean {
  return isRecord(value) && isModuleId(value.moduleId) && isOptionalBoolean(value.optional);
}

function isCapabilityDeclaration(value: unknown): boolean {
  return isRecord(value) && isNamespacedId(value.id) && value.version === 1;
}

function isCapabilityRequirement(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNamespacedId(value.id) &&
    value.version === 1 &&
    isOptionalBoolean(value.optional)
  );
}

function isContribution(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !isNamespacedId(value.id) ||
    typeof value.order !== "number" ||
    !Number.isFinite(value.order)
  ) {
    return false;
  }

  switch (value.kind) {
    case "navigation":
      return (
        typeof value.labelKey === "string" &&
        isNamespacedId(value.routeId) &&
        (value.iconId === undefined || typeof value.iconId === "string") &&
        (value.parentId === undefined || isNamespacedId(value.parentId))
      );
    case "route":
      return (
        typeof value.path === "string" &&
        isModuleId(value.componentId) &&
        (value.parentRouteId === undefined || isNamespacedId(value.parentRouteId)) &&
        isOptionalBoolean(value.index)
      );
    case "redirect":
      return (
        typeof value.path === "string" &&
        typeof value.to === "string" &&
        isOptionalBoolean(value.replace)
      );
    case "action":
      return (
        typeof value.labelKey === "string" &&
        typeof value.placement === "string" &&
        (value.requiredCapability === undefined || isNamespacedId(value.requiredCapability))
      );
    case "tab":
      return (
        typeof value.labelKey === "string" &&
        isNamespacedId(value.parentId) &&
        isNamespacedId(value.routeId)
      );
    default:
      return false;
  }
}

function isOptionalArray(value: unknown, predicate: (item: unknown) => boolean): boolean {
  return value === undefined || (Array.isArray(value) && value.every(predicate));
}

function isManifestShape(value: unknown): value is WarungMengModuleManifest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isModuleId(value.id) &&
    isSurface(value.surface) &&
    value.id.startsWith(`${value.surface}.`) &&
    typeof value.displayNameKey === "string" &&
    value.displayNameKey.length > 0 &&
    isOptionalArray(value.dependsOn, isDependency) &&
    isOptionalArray(value.provides, isCapabilityDeclaration) &&
    isOptionalArray(value.requires, isCapabilityRequirement) &&
    isOptionalArray(value.contributions, isContribution)
  );
}

export function validateManifestShape(
  surface: WarungMengSurface,
  value: unknown,
  source?: string,
): readonly ModuleDiagnostic[] {
  if (!isManifestShape(value)) {
    return [
      {
        code: "manifest-malformed",
        severity: "error",
        message: "Module manifest does not satisfy the required contract.",
        surface,
        source,
      },
    ];
  }

  const diagnostics: ModuleDiagnostic[] = [];
  if (value.version !== 1) {
    diagnostics.push({
      code: "unsupported-version",
      severity: "error",
      message: "Module manifest version is not supported.",
      surface,
      moduleId: value.id,
      source,
      details: {
        version: typeof value.version === "number" ? value.version : String(value.version),
      },
    });
  }
  if (value.surface !== surface) {
    diagnostics.push({
      code: "wrong-surface",
      severity: "error",
      message: "Module manifest belongs to a different surface.",
      surface,
      moduleId: value.id,
      source,
      details: { actualSurface: value.surface },
    });
  }
  return diagnostics;
}

function sortedModuleIds(manifests: readonly WarungMengModuleManifest[]): readonly ModuleId[] {
  return manifests.map(({ id }) => id).sort((left, right) => left.localeCompare(right));
}

export function validateModuleGraph(
  surface: WarungMengSurface,
  manifests: readonly WarungMengModuleManifest[],
): ModuleGraphValidationResult {
  const diagnostics: ModuleDiagnostic[] = [];
  const manifestById = new Map<ModuleId, WarungMengModuleManifest>();
  const contributionOwners = new Map<ContributionId, ModuleId>();
  const capabilityOwners = new Map<CapabilityId, ModuleId>();

  for (const manifest of manifests) {
    const shapeDiagnostics = validateManifestShape(surface, manifest);
    diagnostics.push(...shapeDiagnostics);
    if (shapeDiagnostics.some(({ code }) => code === "manifest-malformed")) {
      continue;
    }

    const existingModule = manifestById.get(manifest.id);
    if (existingModule) {
      diagnostics.push(
        diagnostic(
          surface,
          "duplicate-module-id",
          "Module ID is already registered in the graph.",
          manifest.id,
        ),
      );
      continue;
    }
    manifestById.set(manifest.id, manifest);

    for (const contribution of manifest.contributions ?? []) {
      const existingOwner = contributionOwners.get(contribution.id);
      if (existingOwner) {
        diagnostics.push(
          diagnostic(
            surface,
            "duplicate-contribution-id",
            "Contribution ID is provided by more than one module.",
            manifest.id,
            { contributionId: contribution.id, existingOwnerModuleId: existingOwner },
          ),
        );
      } else {
        contributionOwners.set(contribution.id, manifest.id);
      }
    }

    for (const capability of manifest.provides ?? []) {
      const existingOwner = capabilityOwners.get(capability.id);
      if (existingOwner) {
        diagnostics.push(
          diagnostic(
            surface,
            "duplicate-capability",
            "Capability is declared by more than one module.",
            manifest.id,
            { capabilityId: capability.id, existingOwnerModuleId: existingOwner },
          ),
        );
      } else {
        capabilityOwners.set(capability.id, manifest.id);
      }
    }
  }

  for (const manifest of manifestById.values()) {
    for (const dependency of manifest.dependsOn ?? []) {
      if (!dependency.optional && !manifestById.has(dependency.moduleId)) {
        diagnostics.push(
          diagnostic(
            surface,
            "missing-dependency",
            "Required module dependency is missing.",
            manifest.id,
            { dependencyModuleId: dependency.moduleId },
          ),
        );
      }
    }
    for (const requirement of manifest.requires ?? []) {
      if (!requirement.optional && !capabilityOwners.has(requirement.id)) {
        diagnostics.push(
          diagnostic(
            surface,
            "missing-capability",
            "Required capability provider is missing.",
            manifest.id,
            { capabilityId: requirement.id },
          ),
        );
      }
    }
  }

  const temporary = new Set<ModuleId>();
  const permanent = new Set<ModuleId>();
  const ordered: ModuleId[] = [];
  const cycleRoots = new Set<ModuleId>();

  function visit(moduleId: ModuleId): void {
    if (permanent.has(moduleId)) {
      return;
    }
    if (temporary.has(moduleId)) {
      cycleRoots.add(moduleId);
      return;
    }

    temporary.add(moduleId);
    const manifest = manifestById.get(moduleId);
    const moduleDependencies = (manifest?.dependsOn ?? [])
      .filter(({ moduleId: dependencyId }) => manifestById.has(dependencyId))
      .map(({ moduleId: dependencyId }) => dependencyId);
    const capabilityDependencies = (manifest?.requires ?? [])
      .map(({ id }) => capabilityOwners.get(id))
      .filter((providerId): providerId is ModuleId => providerId !== undefined);
    const dependencies = [...new Set([...moduleDependencies, ...capabilityDependencies])].sort(
      (left, right) => left.localeCompare(right),
    );
    for (const dependencyId of dependencies) {
      visit(dependencyId);
    }
    temporary.delete(moduleId);
    permanent.add(moduleId);
    ordered.push(moduleId);
  }

  for (const moduleId of sortedModuleIds([...manifestById.values()])) {
    visit(moduleId);
  }

  for (const moduleId of [...cycleRoots].sort((left, right) => left.localeCompare(right))) {
    diagnostics.push(
      diagnostic(
        surface,
        "dependency-cycle",
        "Module dependency graph contains a cycle.",
        moduleId,
      ),
    );
  }

  if (diagnostics.length > 0) {
    return { status: "invalid", diagnostics };
  }
  return { status: "valid", orderedModuleIds: ordered };
}
