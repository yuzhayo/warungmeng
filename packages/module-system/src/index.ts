export { MODULE_SURFACES } from "./contracts/moduleSurface";
export type { WarungMengSurface } from "./contracts/moduleSurface";
export type { ModuleId, ContributionId, CapabilityId, ComponentId } from "./contracts/moduleId";
export type { ModuleDependency } from "./contracts/moduleDependency";
export type {
  ModuleCapabilityDeclaration,
  ModuleCapabilityRequirement,
} from "./contracts/moduleCapability";
export type {
  ModuleContributionBase,
  ModuleNavigationContribution,
  ModuleRouteContribution,
  ModuleRedirectContribution,
  ModuleActionContribution,
  ModuleTabContribution,
  ModuleContribution,
} from "./contracts/moduleContribution";
export type { WarungMengModuleManifest } from "./contracts/moduleManifest";
export type {
  ModuleDiagnosticSeverity,
  ModuleDiagnosticCode,
  ModuleDiagnostic,
  ModuleDiagnosticSink,
} from "./contracts/moduleDiagnostic";
export type {
  ModuleActivation,
  WarungMengExtensionContext,
  WarungMengExtension,
} from "./contracts/moduleExtension";

export { createCapabilityToken } from "./capabilities/capabilityRegistry";
export type {
  CapabilityToken,
  CapabilityResolution,
  CapabilityRegistration,
  CapabilityRegistrationResult,
  ScopedCapabilityRegistry,
} from "./capabilities/capabilityRegistry";
export { createModuleDiagnosticCollector } from "./diagnostics/createModuleDiagnosticCollector";
export type { ModuleDiagnosticCollector } from "./diagnostics/createModuleDiagnosticCollector";

export type { ModuleCandidate, ValidatedModuleCandidate } from "./discovery/moduleCandidate";
export type {
  RejectedModuleCandidate,
  ModuleDiscoveryResult,
} from "./discovery/moduleDiscoveryResult";
export { discoverModuleCandidates } from "./discovery/discoverModuleCandidates";

export type { ModuleRegistrationResult, ModuleRegistry } from "./registry/moduleRegistry";
export { createModuleRegistry } from "./registry/createModuleRegistry";
export type { CreateModuleRegistryOptions } from "./registry/createModuleRegistry";
export { validateModuleGraph } from "./registry/validateModuleGraph";
export type { ModuleGraphValidationResult } from "./registry/validateModuleGraph";
export { resolveModuleOrder } from "./registry/resolveModuleOrder";
