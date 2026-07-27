import type { ModuleId } from "../contracts/moduleId";
import type {
  CapabilityRegistration,
  CapabilityRegistryController,
  CapabilityToken,
  ScopedCapabilityRegistry,
} from "./capabilityRegistry";
import { registerCapability, type CapabilityRecord } from "./registerCapability";
import { resolveCapability } from "./resolveCapability";

export function createCapabilityRegistry(): CapabilityRegistryController {
  const records = new Map<string, CapabilityRecord>();

  return {
    createScope(
      ownerModuleId: ModuleId,
      onRegistered?: (registration: CapabilityRegistration) => void,
    ): ScopedCapabilityRegistry {
      return {
        resolve<TContract>(token: CapabilityToken<TContract>) {
          return resolveCapability(records, token);
        },
        provide<TContract>(token: CapabilityToken<TContract>, implementation: TContract) {
          const result = registerCapability(records, ownerModuleId, token, implementation);
          if (result.status === "registered") {
            onRegistered?.(result.registration);
          }
          return result;
        },
      };
    },
    resolve<TContract>(token: CapabilityToken<TContract>) {
      return resolveCapability(records, token);
    },
  };
}
