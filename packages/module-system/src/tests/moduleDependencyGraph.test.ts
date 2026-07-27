import { describe, expect, it } from "vitest";
import {
  resolveModuleOrder,
  validateModuleGraph,
  type ModuleDiagnosticCode,
  type WarungMengModuleManifest,
} from "../index";
import { createManifest } from "./testFixtures";

function diagnosticCodes(manifests: readonly WarungMengModuleManifest[]): ModuleDiagnosticCode[] {
  const result = validateModuleGraph("admin", manifests);
  return result.status === "invalid" ? result.diagnostics.map(({ code }) => code) : [];
}

describe("module dependency graph", () => {
  it("rejects duplicate module IDs", () => {
    expect(diagnosticCodes([createManifest(), createManifest()])).toContain("duplicate-module-id");
  });

  it("rejects duplicate contribution IDs", () => {
    const contribution = {
      id: "navigation.dashboard" as const,
      kind: "navigation" as const,
      order: 0,
      labelKey: "navigation.dashboard",
      routeId: "route.dashboard" as const,
    };

    expect(
      diagnosticCodes([
        createManifest({ contributions: [contribution] }),
        createManifest({ id: "admin.beta", contributions: [contribution] }),
      ]),
    ).toContain("duplicate-contribution-id");
  });

  it("rejects duplicate capability declarations", () => {
    const capability = { id: "catalog.read" as const, version: 1 as const };

    expect(
      diagnosticCodes([
        createManifest({ provides: [capability] }),
        createManifest({ id: "admin.beta", provides: [capability] }),
      ]),
    ).toContain("duplicate-capability");
  });

  it("rejects missing required dependencies", () => {
    expect(
      diagnosticCodes([createManifest({ dependsOn: [{ moduleId: "admin.missing" }] })]),
    ).toContain("missing-dependency");
  });

  it("allows missing optional dependencies", () => {
    expect(
      validateModuleGraph("admin", [
        createManifest({ dependsOn: [{ moduleId: "admin.missing", optional: true }] }),
      ]),
    ).toEqual({ status: "valid", orderedModuleIds: ["admin.alpha"] });
  });

  it("detects dependency cycles", () => {
    expect(
      diagnosticCodes([
        createManifest({ id: "admin.alpha", dependsOn: [{ moduleId: "admin.beta" }] }),
        createManifest({ id: "admin.beta", dependsOn: [{ moduleId: "admin.alpha" }] }),
      ]),
    ).toContain("dependency-cycle");
  });

  it("orders dependencies first with a deterministic tie-breaker", () => {
    const manifests = [
      createManifest({ id: "admin.gamma", dependsOn: [{ moduleId: "admin.alpha" }] }),
      createManifest({ id: "admin.beta" }),
      createManifest({ id: "admin.alpha" }),
    ];

    expect(resolveModuleOrder(manifests)).toEqual({
      status: "valid",
      orderedModuleIds: ["admin.alpha", "admin.beta", "admin.gamma"],
    });
    expect(resolveModuleOrder([...manifests].reverse())).toEqual({
      status: "valid",
      orderedModuleIds: ["admin.alpha", "admin.beta", "admin.gamma"],
    });
  });

  it("orders capability providers before consumers", () => {
    const provider = createManifest({
      id: "admin.z-provider",
      provides: [{ id: "catalog.read", version: 1 }],
    });
    const consumer = createManifest({
      id: "admin.a-consumer",
      requires: [{ id: "catalog.read", version: 1 }],
    });

    expect(resolveModuleOrder([consumer, provider])).toEqual({
      status: "valid",
      orderedModuleIds: ["admin.z-provider", "admin.a-consumer"],
    });
  });

  it("rejects missing required capabilities", () => {
    expect(
      diagnosticCodes([createManifest({ requires: [{ id: "orders.read", version: 1 }] })]),
    ).toContain("missing-capability");
  });

  it("allows missing optional capabilities", () => {
    expect(
      validateModuleGraph("admin", [
        createManifest({ requires: [{ id: "orders.read", version: 1, optional: true }] }),
      ]),
    ).toEqual({ status: "valid", orderedModuleIds: ["admin.alpha"] });
  });
});
