import { describe, expect, expectTypeOf, it } from "vitest";
import { createCapabilityRegistry } from "../capabilities/createCapabilityRegistry";
import { createCapabilityToken, type CapabilityResolution } from "../index";

describe("capability registry", () => {
  it("resolves typed capabilities with their owner", () => {
    interface CatalogReader {
      list(): readonly string[];
    }
    const token = createCapabilityToken<CatalogReader>("catalog.read");
    const registry = createCapabilityRegistry();
    const reader: CatalogReader = { list: () => ["nasi"] };

    registry.createScope("admin.catalog").provide(token, reader);
    const resolution = registry.resolve(token);

    expectTypeOf(resolution).toEqualTypeOf<CapabilityResolution<CatalogReader>>();
    expect(resolution).toEqual({
      status: "available",
      ownerModuleId: "admin.catalog",
      value: reader,
    });
  });

  it("rejects duplicate providers without replacing the active provider", () => {
    const token = createCapabilityToken<{ source: string }>("catalog.read");
    const registry = createCapabilityRegistry();
    const first = { source: "first" };

    registry.createScope("admin.alpha").provide(token, first);
    const duplicate = registry.createScope("admin.beta").provide(token, { source: "second" });

    expect(duplicate).toEqual({
      status: "duplicate",
      capabilityId: "catalog.read",
      existingOwnerModuleId: "admin.alpha",
    });
    expect(registry.resolve(token)).toMatchObject({ value: first });
  });

  it("removes a capability when its registration is disposed", async () => {
    const token = createCapabilityToken<{ read(): string }>("orders.read");
    const registry = createCapabilityRegistry();
    const result = registry.createScope("admin.orders").provide(token, { read: () => "ok" });

    expect(result.status).toBe("registered");
    if (result.status === "registered") {
      await result.registration.dispose();
    }

    expect(registry.resolve(token)).toEqual({
      status: "missing",
      capabilityId: "orders.read",
    });
  });
});
