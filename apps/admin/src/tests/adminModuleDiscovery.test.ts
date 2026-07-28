import { render, screen, waitFor } from "@testing-library/react";
import {
  createModuleRegistry,
  type CapabilityResolution,
  type ModuleCandidate,
  type WarungMengExtension,
} from "@warungmeng/module-system";
import type { DashboardRepositoriesPort } from "../features/dashboard";
import { StrictMode, createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { AdminRuntimeProvider } from "../app/composition/AdminRuntimeProvider";
import { AdminApplicationProviders } from "../app/providers/AdminApplicationProviders";
import { createAdminRepositories } from "../app/composition/createAdminRepositories";
import { createAdminRuntime } from "../app/composition/createAdminRuntime";
import App from "../App";
import { createAdminModuleDiagnostics } from "../app/discovery/adminModuleDiagnostics";
import { discoverAdminModules } from "../app/discovery/discoverAdminModules";
import { createDashboardExtension, reportingReadCapability } from "../features/dashboard";
import { dashboardRepositories } from "../features/dashboard/application/dashboardRepositories";

function candidate(source: string, extension: WarungMengExtension): ModuleCandidate {
  return { source, load: () => extension };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe("Admin module discovery", () => {
  it("creates an Admin-only runtime and rejects a non-Admin registry", async () => {
    const repositories = createAdminRepositories();
    const runtime = createAdminRuntime({ repositories });

    expect(runtime.surface).toBe("admin");
    expect(runtime.registry.surface).toBe("admin");

    const storefrontRegistry = createModuleRegistry({ surface: "storefront" });
    await expect(discoverAdminModules(storefrontRegistry, [])).rejects.toThrow(
      "Admin module discovery requires an admin registry.",
    );
  });

  it("registers candidates deterministically and exposes reporting.read", async () => {
    const repositories = createAdminRepositories();
    let reportingResolution: CapabilityResolution<DashboardRepositoriesPort> | undefined;
    const probe: WarungMengExtension = {
      manifest: {
        id: "admin.reporting-probe",
        version: 1,
        surface: "admin",
        displayNameKey: "test.reportingProbe",
        requires: [{ id: "reporting.read", version: 1 }],
      },
      register({ capabilities }) {
        reportingResolution = capabilities.resolve(reportingReadCapability);
      },
    };
    const registry = createModuleRegistry({ surface: "admin" });

    const result = await discoverAdminModules(registry, [
      candidate("probe", probe),
      candidate("dashboard", createDashboardExtension(repositories.dashboard)),
    ]);

    expect(result.dashboardRegistered).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(registry.list().map(({ id }) => id)).toEqual([
      "admin.dashboard",
      "admin.reporting-probe",
    ]);
    expect(reportingResolution!).toEqual({
      status: "available",
      ownerModuleId: "admin.dashboard",
      value: repositories.dashboard,
    });
  });

  it("keeps Dashboard active when an optional candidate is invalid", async () => {
    const repositories = createAdminRepositories();
    const diagnostics = createAdminModuleDiagnostics();
    const registry = createModuleRegistry({ surface: "admin", diagnostics });

    const result = await discoverAdminModules(
      registry,
      [
        {
          source: "optional.invalid",
          load: () => ({ manifest: null }),
        },
        candidate("dashboard", createDashboardExtension(repositories.dashboard)),
      ],
      diagnostics,
    );

    expect(result.dashboardRegistered).toBe(true);
    expect(registry.list().map(({ id }) => id)).toEqual(["admin.dashboard"]);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: "manifest-malformed",
        source: "optional.invalid",
        surface: "admin",
      }),
    ]);
    expect(diagnostics.list()).toEqual(result.diagnostics);
  });

  it("keeps application content active and exposes diagnostics when Dashboard registration fails", async () => {
    const repositories = createAdminRepositories();
    const runtime = createAdminRuntime({
      repositories,
      candidates: [{ source: "dashboard", load: () => ({ manifest: null }) }],
    });

    window.localStorage.clear();
    window.location.hash = "#/orders";
    const view = render(createElement(App, { runtime }));

    // The Orders module never registered in this runtime, so its route shows
    // the explicit no-capability state instead of silently using another
    // instance; the shell and navigation stay active.
    expect(await screen.findByText("Pesanan gagal dimuat.")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
    expect(runtime.getSnapshot()).toEqual({
      status: "degraded",
      dashboardAvailable: false,
      diagnostics: [
        expect.objectContaining({
          code: "manifest-malformed",
          source: "dashboard",
          surface: "admin",
        }),
      ],
    });
    expect(() => dashboardRepositories.orders).not.toThrow();

    window.location.hash = "#/";
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Dashboard & Laporan" })).toBeInTheDocument(),
    );
    expect(await screen.findByText("Dashboard gagal dimuat")).toBeInTheDocument();

    view.unmount();
    await waitFor(() => expect(runtime.getSnapshot().status).toBe("idle"));
    expect(() => dashboardRepositories.orders).toThrow(
      "Dashboard repositories are not bound to an active Admin runtime.",
    );
  });

  it("disposes modules, capabilities, and compatibility bindings idempotently", async () => {
    const repositories = createAdminRepositories();
    const extension = createDashboardExtension(repositories.dashboard);
    const activationDispose = vi.fn();
    const runtime = createAdminRuntime({
      repositories,
      candidates: [
        candidate("dashboard", {
          ...extension,
          register(context) {
            extension.register(context);
            return { dispose: activationDispose };
          },
        }),
      ],
    });

    await runtime.initialize();
    expect(runtime.registry.list().map(({ id }) => id)).toEqual(["admin.dashboard"]);
    expect(runtime.registry.resolve("admin.dashboard")).toBeDefined();
    expect(dashboardRepositories.orders).toBe(repositories.dashboard.orders);

    const firstDisposal = runtime.dispose();
    const secondDisposal = runtime.dispose();
    expect(secondDisposal).toBe(firstDisposal);
    await firstDisposal;
    await secondDisposal;

    expect(runtime.getSnapshot()).toEqual({
      status: "idle",
      dashboardAvailable: false,
      diagnostics: [],
    });
    expect(runtime.registry.list()).toEqual([]);
    expect(runtime.registry.resolve("admin.dashboard")).toBeUndefined();
    const capabilityProbe: WarungMengExtension = {
      manifest: {
        id: "admin.disposal-probe",
        version: 1,
        surface: "admin",
        displayNameKey: "test.disposalProbe",
      },
      register({ capabilities }) {
        const resolution = capabilities.resolve(reportingReadCapability);
        expect(resolution).toEqual({ status: "missing", capabilityId: "reporting.read" });
      },
    };
    await expect(runtime.registry.register(capabilityProbe)).resolves.toMatchObject({
      status: "registered",
    });
    await runtime.registry.dispose("admin.disposal-probe");
    expect(activationDispose).toHaveBeenCalledOnce();
    expect(() => dashboardRepositories.orders).toThrow(
      "Dashboard repositories are not bound to an active Admin runtime.",
    );

    await runtime.dispose();
    expect(activationDispose).toHaveBeenCalledOnce();
  });

  it("supports independent initialize/dispose cycles without stale registrations", async () => {
    const repositories = createAdminRepositories();
    const extension = createDashboardExtension(repositories.dashboard);
    const register = vi.fn(extension.register.bind(extension));
    const load = vi.fn(() => ({ ...extension, register }));
    const runtime = createAdminRuntime({
      repositories,
      candidates: [{ source: "dashboard", load }],
    });

    await runtime.initialize();
    await runtime.dispose();
    await runtime.initialize();

    expect(runtime.getSnapshot().status).toBe("ready");
    expect(runtime.registry.list().map(({ id }) => id)).toEqual(["admin.dashboard"]);
    expect(load).toHaveBeenCalledTimes(2);
    expect(register).toHaveBeenCalledTimes(2);
    expect(dashboardRepositories.orders).toBe(repositories.dashboard.orders);

    await runtime.dispose();
  });

  it("shows localized loading for a deferred candidate without reinitializing on rerender", async () => {
    window.localStorage.setItem("wm.language", "id");
    const repositories = createAdminRepositories();
    const deferred = createDeferred<WarungMengExtension>();
    const load = vi.fn(() => deferred.promise);
    const runtime = createAdminRuntime({
      repositories,
      candidates: [{ source: "dashboard", load }],
    });
    const applicationContent = createElement("div", null, "deferred application content");
    const view = render(
      createElement(AdminApplicationProviders, {
        runtime,
        children: applicationContent,
      }),
    );

    expect(
      await screen.findByRole("status", { name: "Memuat aplikasi admin..." }),
    ).toBeInTheDocument();
    expect(screen.queryByText("deferred application content")).not.toBeInTheDocument();
    expect(load).toHaveBeenCalledOnce();
    view.rerender(
      createElement(AdminApplicationProviders, {
        runtime,
        children: applicationContent,
      }),
    );
    expect(load).toHaveBeenCalledOnce();
    expect(runtime.repositories).toBe(repositories);
    expect(runtime.repositories.dashboard).toBe(repositories.dashboard);

    deferred.resolve(createDashboardExtension(repositories.dashboard));
    expect(await screen.findByText("deferred application content")).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Memuat aplikasi admin..." }),
    ).not.toBeInTheDocument();

    view.unmount();
    await waitFor(() => expect(runtime.getSnapshot().status).toBe("idle"));
  });

  it("shows the startup fallback in English when English is active", async () => {
    window.localStorage.setItem("wm.language", "en");
    const repositories = createAdminRepositories();
    const deferred = createDeferred<WarungMengExtension>();
    const runtime = createAdminRuntime({
      repositories,
      candidates: [{ source: "dashboard", load: () => deferred.promise }],
    });
    const view = render(
      createElement(AdminApplicationProviders, {
        runtime,
        children: createElement("div", null, "English application content"),
      }),
    );

    expect(
      await screen.findByRole("status", { name: "Loading admin application..." }),
    ).toBeInTheDocument();

    deferred.resolve(createDashboardExtension(repositories.dashboard));
    expect(await screen.findByText("English application content")).toBeInTheDocument();
    view.unmount();
    await waitFor(() => expect(runtime.getSnapshot().status).toBe("idle"));
  });

  it("is reversible under React StrictMode lifecycle replay", async () => {
    const repositories = createAdminRepositories();
    const extension = createDashboardExtension(repositories.dashboard);
    const register = vi.fn(extension.register.bind(extension));
    const load = vi.fn(() => ({ ...extension, register }));
    const runtime = createAdminRuntime({
      repositories,
      candidates: [{ source: "dashboard", load }],
    });

    const view = render(
      createElement(
        StrictMode,
        null,
        createElement(AdminRuntimeProvider, {
          runtime,
          children: createElement("div", null, "ready"),
        }),
      ),
    );

    await waitFor(() => expect(runtime.getSnapshot().status).toBe("ready"));
    expect(runtime.registry.list().map(({ id }) => id)).toEqual(["admin.dashboard"]);
    expect(runtime.repositories).toBe(repositories);
    expect(runtime.repositories.dashboard).toBe(repositories.dashboard);

    view.unmount();
    await waitFor(() => expect(runtime.getSnapshot().status).toBe("idle"));
    expect(runtime.registry.list()).toEqual([]);
    expect(load).toHaveBeenCalledOnce();
    expect(register).toHaveBeenCalledOnce();
  });
});
