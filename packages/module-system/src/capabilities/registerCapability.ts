import type {
  CapabilityRegistration,
  CapabilityRegistrationResult,
  CapabilityToken,
} from "./capabilityRegistry";
import type { ModuleId } from "../contracts/moduleId";

export interface CapabilityRecord {
  readonly ownerModuleId: ModuleId;
  readonly value: unknown;
}

export function registerCapability<TContract>(
  records: Map<string, CapabilityRecord>,
  ownerModuleId: ModuleId,
  token: CapabilityToken<TContract>,
  implementation: TContract,
): CapabilityRegistrationResult {
  const existing = records.get(token.id);
  if (existing) {
    return {
      status: "duplicate",
      capabilityId: token.id,
      existingOwnerModuleId: existing.ownerModuleId,
    };
  }

  const record: CapabilityRecord = { ownerModuleId, value: implementation };
  let active = true;
  records.set(token.id, record);

  const registration: CapabilityRegistration = {
    capabilityId: token.id,
    dispose() {
      if (active && records.get(token.id) === record) {
        records.delete(token.id);
      }
      active = false;
    },
  };

  return { status: "registered", registration };
}
