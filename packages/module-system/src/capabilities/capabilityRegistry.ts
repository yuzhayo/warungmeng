import type { CapabilityId, ModuleId } from "../contracts/moduleId";

declare const capabilityContractType: unique symbol;

export interface CapabilityToken<TContract> {
  readonly id: CapabilityId;
  readonly version: 1;
  readonly [capabilityContractType]?: (contract: TContract) => TContract;
}

export function createCapabilityToken<TContract>(id: CapabilityId): CapabilityToken<TContract> {
  return { id, version: 1 };
}

export type CapabilityResolution<TContract> =
  | {
      readonly status: "available";
      readonly ownerModuleId: ModuleId;
      readonly value: TContract;
    }
  | {
      readonly status: "missing";
      readonly capabilityId: CapabilityId;
    };

export interface CapabilityRegistration {
  readonly capabilityId: CapabilityId;
  dispose(): void | Promise<void>;
}

export type CapabilityRegistrationResult =
  | {
      readonly status: "registered";
      readonly registration: CapabilityRegistration;
    }
  | {
      readonly status: "duplicate";
      readonly capabilityId: CapabilityId;
      readonly existingOwnerModuleId: ModuleId;
    };

export interface ScopedCapabilityRegistry {
  resolve<TContract>(token: CapabilityToken<TContract>): CapabilityResolution<TContract>;

  provide<TContract>(
    token: CapabilityToken<TContract>,
    implementation: TContract,
  ): CapabilityRegistrationResult;
}

export interface CapabilityRegistryController {
  createScope(
    ownerModuleId: ModuleId,
    onRegistered?: (registration: CapabilityRegistration) => void,
  ): ScopedCapabilityRegistry;
  resolve<TContract>(token: CapabilityToken<TContract>): CapabilityResolution<TContract>;
}
