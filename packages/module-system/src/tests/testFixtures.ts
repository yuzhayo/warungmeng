import type {
  ModuleActivation,
  ModuleId,
  WarungMengExtension,
  WarungMengExtensionContext,
  WarungMengModuleManifest,
} from "../index";

export function createManifest(
  overrides: Partial<WarungMengModuleManifest> = {},
): WarungMengModuleManifest {
  return {
    id: "admin.alpha",
    version: 1,
    surface: "admin",
    displayNameKey: "modules.alpha",
    ...overrides,
  };
}

export function createExtension(
  manifest: WarungMengModuleManifest = createManifest(),
  register: (
    context: WarungMengExtensionContext,
  ) => void | ModuleActivation | Promise<void | ModuleActivation> = () => undefined,
): WarungMengExtension {
  return { manifest, register };
}

export function moduleId(value: `admin.${string}` | `storefront.${string}`): ModuleId {
  return value;
}
