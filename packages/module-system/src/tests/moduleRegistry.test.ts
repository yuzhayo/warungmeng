import { describe, expect, it } from "vitest";
import {
  createCapabilityToken,
  createModuleDiagnosticCollector,
  createModuleRegistry,
} from "../index";
import { createExtension, createManifest } from "./testFixtures";

describe("module registry", () => {
  it("registers and resolves a valid module", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    const manifest = createManifest();

    await expect(registry.register(createExtension(manifest))).resolves.toEqual({
      status: "registered",
      manifest,
    });
    expect(registry.resolve("admin.alpha")).toEqual(manifest);
    expect(registry.list()).toEqual([manifest]);
  });

  it("rejects malformed nested manifests without invoking the extension", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    let invoked = false;
    const malformed = createExtension(
      { ...createManifest(), requires: "orders.read" } as never,
      () => {
        invoked = true;
      },
    );

    await expect(registry.register(malformed)).resolves.toMatchObject({
      status: "rejected",
      diagnostics: [expect.objectContaining({ code: "manifest-malformed" })],
    });
    expect(invoked).toBe(false);
  });

  it("rejects duplicate module IDs without invoking the duplicate extension", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    let duplicateInvoked = false;
    await registry.register(createExtension());

    const result = await registry.register(
      createExtension(createManifest(), () => {
        duplicateInvoked = true;
      }),
    );

    expect(result).toMatchObject({
      status: "rejected",
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: "duplicate-module-id" }),
      ]),
    });
    expect(duplicateInvoked).toBe(false);
    expect(registry.list()).toHaveLength(1);
  });

  it("reports rejection diagnostics once", async () => {
    const diagnostics = createModuleDiagnosticCollector();
    const registry = createModuleRegistry({ surface: "admin", diagnostics });
    await registry.register(createExtension());

    await registry.register(createExtension());

    expect(diagnostics.list().filter(({ code }) => code === "duplicate-module-id")).toHaveLength(1);
  });

  it("registers capability providers before consumers in a deterministic batch", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    const token = createCapabilityToken<{ read(): string }>("catalog.read");
    let resolvedValue = "";
    const consumer = createExtension(
      createManifest({
        id: "admin.a-consumer",
        requires: [{ id: token.id, version: 1 }],
      }),
      ({ capabilities }) => {
        const resolution = capabilities.resolve(token);
        resolvedValue = resolution.status === "available" ? resolution.value.read() : "missing";
      },
    );
    const provider = createExtension(
      createManifest({
        id: "admin.z-provider",
        provides: [{ id: token.id, version: 1 }],
      }),
      ({ capabilities }) => {
        capabilities.provide(token, { read: () => "ready" });
      },
    );

    await expect(registry.registerAll([consumer, provider])).resolves.toMatchObject([
      { status: "registered" },
      { status: "registered" },
    ]);
    expect(resolvedValue).toBe("ready");
    expect(registry.list().map(({ id }) => id)).toEqual(["admin.z-provider", "admin.a-consumer"]);
  });

  it("registers a batch against capabilities already active in the registry", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    const token = createCapabilityToken<{ read(): string }>("catalog.read");
    await registry.register(
      createExtension(
        createManifest({
          id: "admin.provider",
          provides: [{ id: token.id, version: 1 }],
        }),
        ({ capabilities }) => {
          capabilities.provide(token, { read: () => "active" });
        },
      ),
    );
    let observed = "";
    const consumer = createExtension(
      createManifest({
        id: "admin.consumer",
        requires: [{ id: token.id, version: 1 }],
      }),
      ({ capabilities }) => {
        const resolution = capabilities.resolve(token);
        observed = resolution.status === "available" ? resolution.value.read() : "missing";
      },
    );

    await expect(registry.registerAll([consumer])).resolves.toMatchObject([
      { status: "registered" },
    ]);
    expect(observed).toBe("active");
  });

  it("exposes a missing optional capability without crashing registration", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    const token = createCapabilityToken<{ read(): string }>("catalog.read");
    let observedStatus = "";
    const extension = createExtension(
      createManifest({ requires: [{ id: token.id, version: 1, optional: true }] }),
      ({ capabilities }) => {
        observedStatus = capabilities.resolve(token).status;
      },
    );

    await expect(registry.register(extension)).resolves.toMatchObject({ status: "registered" });
    expect(observedStatus).toBe("missing");
  });

  it("rejects missing required capabilities before invoking the extension", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    let invoked = false;
    const extension = createExtension(
      createManifest({ requires: [{ id: "orders.read", version: 1 }] }),
      () => {
        invoked = true;
      },
    );

    await expect(registry.register(extension)).resolves.toMatchObject({
      status: "rejected",
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: "missing-capability" }),
      ]),
    });
    expect(invoked).toBe(false);
  });

  it("rolls back capabilities when registration fails", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    const token = createCapabilityToken<{ run(): void }>("orders.manage");
    const failed = createExtension(
      createManifest({ provides: [{ id: token.id, version: 1 }] }),
      ({ capabilities }) => {
        capabilities.provide(token, { run() {} });
        throw new Error("registration detail must not leak");
      },
    );

    await expect(registry.register(failed)).resolves.toMatchObject({
      status: "failed",
      diagnostics: [{ code: "registration-failed" }],
    });

    const replacement = createExtension(
      createManifest({ id: "admin.replacement", provides: [{ id: token.id, version: 1 }] }),
      ({ capabilities }) => {
        capabilities.provide(token, { run() {} });
      },
    );
    await expect(registry.register(replacement)).resolves.toMatchObject({ status: "registered" });
  });

  it("rejects and rolls back an undeclared capability registration", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    const token = createCapabilityToken<{ run(): void }>("orders.manage");
    const invalid = createExtension(createManifest(), ({ capabilities }) => {
      capabilities.provide(token, { run() {} });
    });

    await expect(registry.register(invalid)).resolves.toMatchObject({
      status: "failed",
      diagnostics: [expect.objectContaining({ code: "registration-failed" })],
    });

    const replacement = createExtension(
      createManifest({
        id: "admin.replacement",
        provides: [{ id: token.id, version: 1 }],
      }),
      ({ capabilities }) => {
        capabilities.provide(token, { run() {} });
      },
    );
    await expect(registry.register(replacement)).resolves.toMatchObject({ status: "registered" });
  });

  it("rolls back activation before capabilities when a later invariant fails", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    const events: string[] = [];
    const declared = createCapabilityToken<{ run(): void }>("orders.manage");
    const actual = createCapabilityToken<{ run(): void }>("orders.read");
    const extension = createExtension(
      createManifest({ provides: [{ id: declared.id, version: 1 }] }),
      ({ capabilities }) => {
        const result = capabilities.provide(actual, { run() {} });
        if (result.status === "registered") {
          const originalDispose = result.registration.dispose.bind(result.registration);
          result.registration.dispose = async () => {
            events.push("capability");
            await originalDispose();
          };
        }
        return {
          dispose() {
            events.push("activation");
          },
        };
      },
    );

    await expect(registry.register(extension)).resolves.toMatchObject({ status: "failed" });
    expect(events).toEqual(["activation", "capability"]);
  });

  it("disposes modules in reverse deterministic registration order", async () => {
    const registry = createModuleRegistry({ surface: "admin" });
    const events: string[] = [];
    for (const id of ["admin.alpha", "admin.beta", "admin.gamma"] as const) {
      await registry.register(
        createExtension(createManifest({ id }), () => ({
          dispose() {
            events.push(id);
          },
        })),
      );
    }

    await registry.disposeAll();

    expect(events).toEqual(["admin.gamma", "admin.beta", "admin.alpha"]);
    expect(registry.list()).toEqual([]);
  });

  it("reports disposal failures without exposing raw errors", async () => {
    const diagnostics = createModuleDiagnosticCollector();
    const registry = createModuleRegistry({ surface: "admin", diagnostics });
    await registry.register(
      createExtension(createManifest(), () => ({
        dispose() {
          throw new Error("private disposal detail");
        },
      })),
    );

    await registry.disposeAll();

    expect(diagnostics.list()).toContainEqual(
      expect.objectContaining({ code: "disposal-failed", moduleId: "admin.alpha" }),
    );
    expect(JSON.stringify(diagnostics.list())).not.toContain("private disposal detail");
  });
});
