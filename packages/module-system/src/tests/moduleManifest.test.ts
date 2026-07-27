import { describe, expect, it } from "vitest";
import {
  discoverModuleCandidates,
  validateModuleGraph,
  type ModuleCandidate,
  type WarungMengExtension,
} from "../index";
import { createExtension, createManifest } from "./testFixtures";

describe("module manifest discovery", () => {
  it("accepts a valid manifest and extension", async () => {
    const extension = createExtension();
    const result = await discoverModuleCandidates("admin", [
      { source: "alpha", load: () => extension },
    ]);

    expect(result.valid).toEqual([{ source: "alpha", extension }]);
    expect(result.rejected).toEqual([]);
    expect(result.diagnostics).toEqual([]);
  });

  it("rejects malformed manifests with a stable diagnostic", async () => {
    const malformed = {
      manifest: { id: "admin.alpha", version: 1, surface: "admin" },
      register() {},
    };
    const result = await discoverModuleCandidates("admin", [
      { source: "malformed", load: () => malformed },
    ]);

    expect(result.valid).toEqual([]);
    expect(result.rejected[0]?.diagnostics).toMatchObject([
      { code: "manifest-malformed", source: "malformed", surface: "admin" },
    ]);
  });

  it("rejects malformed nested contract fields without throwing", async () => {
    const extension = {
      ...createExtension(),
      manifest: { ...createManifest(), dependsOn: "admin.beta" },
    } as unknown as WarungMengExtension;

    await expect(
      discoverModuleCandidates("admin", [{ source: "bad-dependency", load: () => extension }]),
    ).resolves.toMatchObject({
      valid: [],
      rejected: [
        {
          source: "bad-dependency",
          diagnostics: [expect.objectContaining({ code: "manifest-malformed" })],
        },
      ],
    });
  });

  it("rejects unsupported manifest versions", async () => {
    const extension = {
      ...createExtension(),
      manifest: { ...createManifest(), version: 2 },
    } as unknown as WarungMengExtension;
    const result = await discoverModuleCandidates("admin", [
      { source: "future", load: () => extension },
    ]);

    expect(result.rejected[0]?.diagnostics).toMatchObject([
      { code: "unsupported-version", moduleId: "admin.alpha" },
    ]);
  });

  it("rejects manifests whose ID prefix disagrees with their declared surface", async () => {
    const extension = createExtension(createManifest({ id: "storefront.alpha", surface: "admin" }));
    const result = await discoverModuleCandidates("admin", [
      { source: "mismatched-id", load: () => extension },
    ]);

    expect(result.rejected[0]?.diagnostics).toMatchObject([
      { code: "manifest-malformed", source: "mismatched-id" },
    ]);
  });

  it("rejects candidates for the wrong surface", async () => {
    const extension = createExtension(createManifest({ surface: "admin" }));
    const result = await discoverModuleCandidates("storefront", [
      { source: "admin-only", load: () => extension },
    ]);

    expect(result.rejected[0]?.diagnostics).toMatchObject([
      { code: "wrong-surface", surface: "storefront", moduleId: "admin.alpha" },
    ]);
  });

  it("isolates an invalid candidate without dropping valid candidates", async () => {
    const valid = createExtension();
    const candidates: ModuleCandidate[] = [
      { source: "invalid-optional", load: () => ({ manifest: null, register() {} }) },
      { source: "valid", load: () => valid },
    ];
    const result = await discoverModuleCandidates("admin", candidates);

    expect(result.valid).toEqual([{ source: "valid", extension: valid }]);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.diagnostics[0]?.code).toBe("manifest-malformed");
  });

  it("isolates candidate load failures", async () => {
    const result = await discoverModuleCandidates("admin", [
      {
        source: "load-failure",
        load() {
          throw new Error("private loader detail");
        },
      },
    ]);

    expect(result.rejected[0]?.diagnostics).toEqual([
      {
        code: "candidate-load-failed",
        severity: "error",
        message: "Module candidate could not be loaded.",
        surface: "admin",
        source: "load-failure",
      },
    ]);
    expect(JSON.stringify(result.diagnostics)).not.toContain("private loader detail");
  });

  it("exports manifests that validate through the public API", () => {
    expect(validateModuleGraph("admin", [createManifest()])).toEqual({
      status: "valid",
      orderedModuleIds: ["admin.alpha"],
    });
  });
});
