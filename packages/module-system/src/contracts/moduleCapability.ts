import type { CapabilityId } from "./moduleId";

export interface ModuleCapabilityDeclaration {
  readonly id: CapabilityId;
  readonly version: 1;
}

export interface ModuleCapabilityRequirement {
  readonly id: CapabilityId;
  readonly version: 1;
  readonly optional?: boolean;
}
