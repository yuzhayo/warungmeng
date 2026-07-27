import type { ModuleCapabilityDeclaration, ModuleCapabilityRequirement } from "./moduleCapability";
import type { ModuleContribution } from "./moduleContribution";
import type { ModuleDependency } from "./moduleDependency";
import type { ModuleId } from "./moduleId";
import type { WarungMengSurface } from "./moduleSurface";

export interface WarungMengModuleManifest {
  readonly id: ModuleId;
  readonly version: 1;
  readonly surface: WarungMengSurface;
  readonly displayNameKey: string;
  readonly dependsOn?: readonly ModuleDependency[];
  readonly provides?: readonly ModuleCapabilityDeclaration[];
  readonly requires?: readonly ModuleCapabilityRequirement[];
  readonly contributions?: readonly ModuleContribution[];
}
