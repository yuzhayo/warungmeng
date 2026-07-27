import type { CapabilityResolution, CapabilityToken } from "./capabilityRegistry";
import type { CapabilityRecord } from "./registerCapability";

export function resolveCapability<TContract>(
  records: ReadonlyMap<string, CapabilityRecord>,
  token: CapabilityToken<TContract>,
): CapabilityResolution<TContract> {
  const record = records.get(token.id);
  if (!record) {
    return { status: "missing", capabilityId: token.id };
  }

  return {
    status: "available",
    ownerModuleId: record.ownerModuleId,
    value: record.value as TContract,
  };
}
