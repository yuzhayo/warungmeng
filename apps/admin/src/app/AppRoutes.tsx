import { Spin } from "antd";
import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "../components/layout/AdminShell";
import { useAdminRuntime } from "./composition/AdminRuntimeProvider";
import { resolveAdminManifestSet } from "./discovery/adminBuiltInManifests";
import { getRouteComponent } from "./routing/adminRouteComponentRegistry";
import { resolveAdminRoutes, type AdminRouteViewModel } from "./routing/resolveAdminRoutes";

function RouteLoadingFallback() {
  return (
    <div aria-label="Memuat halaman" aria-live="polite" role="status">
      <Spin size="small" />
    </div>
  );
}

function buildRouteTree(
  routes: readonly AdminRouteViewModel[],
  parentId: string | undefined,
): React.ReactNode {
  return routes
    .filter((route) => route.parentRouteId === parentId)
    .map((route) => {
      const element =
        route.kind === "redirect" ? (
          <Navigate replace={route.replace ?? true} to={route.to ?? "/"} />
        ) : route.componentId ? (
          (() => {
            const Component = getRouteComponent(route.componentId);
            return Component ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <Component />
              </Suspense>
            ) : null;
          })()
        ) : null;

      if (!element) return null;
      const children = buildRouteTree(routes, route.id);
      if (route.index) {
        return <Route index element={element} key={route.id} />;
      }
      return (
        <Route element={element} key={route.id} path={route.path ?? route.fullPath}>
          {children}
        </Route>
      );
    });
}

export function AppRoutes() {
  const runtime = useAdminRuntime();
  const { manifests } = resolveAdminManifestSet(runtime.registry.list());
  const resolution = resolveAdminRoutes(manifests);
  const resolvedModuleIds = new Set(
    resolution.modules
      .filter(({ status }) => status === "resolved")
      .map(({ moduleId }) => moduleId),
  );
  const resolvedRoutes = resolution.routes.filter((route) => resolvedModuleIds.has(route.moduleId));

  return (
    <Routes>
      <Route element={<AdminShell />}>{buildRouteTree(resolvedRoutes, undefined)}</Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
