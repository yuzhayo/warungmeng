import type {
  ModuleRedirectContribution,
  ModuleRouteContribution,
  WarungMengModuleManifest,
} from "@warungmeng/module-system";
import { getRouteComponent } from "./adminRouteComponentRegistry";

export type AdminRouteKind = "route" | "redirect";
export type AdminRouteModuleStatus = "resolved" | "fallback" | "absent";

export interface AdminRouteViewModel {
  readonly moduleId: string;
  readonly id: string;
  /** Absent for index routes, which must not carry a path in React Router. */
  readonly path?: string;
  readonly fullPath: string;
  readonly componentId?: string;
  readonly parentRouteId?: string;
  readonly index?: boolean;
  readonly kind: AdminRouteKind;
  readonly to?: string;
  readonly replace?: boolean;
}

export interface AdminRouteModuleResolution {
  readonly moduleId: string;
  readonly status: AdminRouteModuleStatus;
  readonly routeIds: readonly string[];
}

export interface AdminRoutesResolution {
  readonly routes: readonly AdminRouteViewModel[];
  readonly diagnostics: readonly string[];
  readonly modules: readonly AdminRouteModuleResolution[];
  readonly routePaths: ReadonlyMap<string, string>;
  readonly resolvedRouteIds: ReadonlySet<string>;
}

interface RouteCandidate {
  readonly moduleId: string;
  readonly kind: AdminRouteKind;
  readonly id: string;
  readonly order: number;
  readonly path: string;
  readonly componentId?: string;
  readonly parentRouteId?: string;
  readonly index?: boolean;
  readonly to?: string;
  readonly replace?: boolean;
}

function sortCandidates(left: RouteCandidate, right: RouteCandidate): number {
  if (left.order !== right.order) return left.order - right.order;
  return left.id.localeCompare(right.id);
}

function normalisePath(path: string): string {
  if (!path || path === "/") return "/";
  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  return withLeadingSlash.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
}

function joinPath(parent: string, child: string): string {
  if (!child || child === "/") return normalisePath(parent);
  if (child.startsWith("/")) return normalisePath(child);
  return normalisePath(`${parent}/${child}`);
}

function toCandidate(
  moduleId: string,
  contribution: ModuleRouteContribution | ModuleRedirectContribution,
): RouteCandidate {
  if (contribution.kind === "redirect") {
    return {
      moduleId,
      kind: "redirect",
      id: contribution.id,
      order: contribution.order,
      path: contribution.path,
      to: contribution.to,
      replace: contribution.replace,
    };
  }
  return {
    moduleId,
    kind: "route",
    id: contribution.id,
    order: contribution.order,
    path: contribution.path,
    componentId: contribution.componentId,
    parentRouteId: contribution.parentRouteId,
    index: contribution.index,
  };
}

/**
 * Converts manifest route/redirect metadata into a deterministic route tree.
 * Validation is module-aware: a broken module is reported as `fallback` while
 * unrelated resolved modules remain renderable.
 */
export function resolveAdminRoutes(
  manifests: readonly WarungMengModuleManifest[],
): AdminRoutesResolution {
  const diagnostics: string[] = [];
  const candidatesByModule = new Map<string, RouteCandidate[]>();
  const allCandidates = new Map<string, RouteCandidate>();
  const invalidModules = new Set<string>();
  const knownModules = new Set<string>();
  const seenManifestIds = new Set<string>();

  for (const manifest of manifests) {
    knownModules.add(manifest.id);
    if (seenManifestIds.has(manifest.id)) {
      diagnostics.push(
        `[resolveAdminRoutes] Duplicate manifest "${manifest.id}". Keeping the first manifest.`,
      );
      continue;
    }
    seenManifestIds.add(manifest.id);
    if (manifest.surface !== "admin") {
      diagnostics.push(
        `[resolveAdminRoutes] Manifest "${manifest.id}" has surface "${manifest.surface}", expected "admin". Skipping.`,
      );
      invalidModules.add(manifest.id);
      continue;
    }

    for (const contribution of manifest.contributions ?? []) {
      if (contribution.kind !== "route" && contribution.kind !== "redirect") continue;
      const candidate = toCandidate(manifest.id, contribution);
      const existing = allCandidates.get(candidate.id);
      if (existing) {
        diagnostics.push(
          `[resolveAdminRoutes] Duplicate contribution ID "${candidate.id}". Keeping the first contribution.`,
        );
        // A duplicate contribution makes the owning module unsafe. The first
        // record remains useful for diagnostics, but the module is rejected
        // atomically from the render graph.
        invalidModules.add(candidate.moduleId);
        continue;
      }
      allCandidates.set(candidate.id, candidate);
      const moduleCandidates = candidatesByModule.get(candidate.moduleId) ?? [];
      moduleCandidates.push(candidate);
      candidatesByModule.set(candidate.moduleId, moduleCandidates);
    }
  }

  // Duplicate route paths are rejected locally; the first contribution remains
  // available so characterization diagnostics retain useful evidence.
  const seenPathKeys = new Set<string>();
  const dedupedCandidates = new Map<string, RouteCandidate>();
  for (const candidate of allCandidates.values()) {
    const key = `${candidate.parentRouteId ?? "__root__"}::${candidate.index ? "__index__" : candidate.path}`;
    if (seenPathKeys.has(key)) {
      diagnostics.push(
        `[resolveAdminRoutes] Duplicate route path key "${key}" for contribution "${candidate.id}". Keeping the first contribution.`,
      );
      invalidModules.add(candidate.moduleId);
      continue;
    }
    seenPathKeys.add(key);
    dedupedCandidates.set(candidate.id, candidate);
  }

  const cycleIds = new Set<string>();
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string): void {
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      cycleIds.add(id);
      diagnostics.push(`[resolveAdminRoutes] Route parent cycle detected at "${id}".`);
      return;
    }
    visiting.add(id);
    const candidate = dedupedCandidates.get(id);
    if (candidate?.parentRouteId) {
      if (dedupedCandidates.has(candidate.parentRouteId)) {
        visit(candidate.parentRouteId);
      } else {
        diagnostics.push(
          `[resolveAdminRoutes] Route "${candidate.id}" references missing parent "${candidate.parentRouteId}".`,
        );
        invalidModules.add(candidate.moduleId);
      }
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of dedupedCandidates.keys()) visit(id);

  // Mark every node in a discovered cycle. A second pass through descendants
  // propagates the invalid parent state without recursion overflow.
  for (const cycleId of cycleIds) {
    const cycleOwner = dedupedCandidates.get(cycleId)?.moduleId;
    if (cycleOwner) invalidModules.add(cycleOwner);
  }

  const accepted = new Map<string, RouteCandidate>();
  const rejected = new Set<string>();
  const pending = [...dedupedCandidates.values()].sort(sortCandidates);
  let changed = true;
  while (changed) {
    changed = false;
    for (const candidate of pending) {
      if (accepted.has(candidate.id) || rejected.has(candidate.id)) continue;
      if (cycleIds.has(candidate.id)) {
        rejected.add(candidate.id);
        changed = true;
        continue;
      }
      if (candidate.kind === "route" && !candidate.componentId) {
        diagnostics.push(`[resolveAdminRoutes] Route "${candidate.id}" has no component ID.`);
        invalidModules.add(candidate.moduleId);
        rejected.add(candidate.id);
        changed = true;
        continue;
      }
      if (
        candidate.kind === "route" &&
        candidate.componentId &&
        !getRouteComponent(candidate.componentId)
      ) {
        diagnostics.push(
          `[resolveAdminRoutes] Route "${candidate.id}" references unknown component "${candidate.componentId}".`,
        );
        invalidModules.add(candidate.moduleId);
        rejected.add(candidate.id);
        changed = true;
        continue;
      }
      if (candidate.kind === "redirect" && !candidate.to) {
        diagnostics.push(`[resolveAdminRoutes] Redirect "${candidate.id}" has no target.`);
        invalidModules.add(candidate.moduleId);
        rejected.add(candidate.id);
        changed = true;
        continue;
      }
      if (candidate.parentRouteId) {
        const parent = accepted.get(candidate.parentRouteId);
        if (!parent) {
          if (rejected.has(candidate.parentRouteId)) {
            diagnostics.push(
              `[resolveAdminRoutes] Route "${candidate.id}" parent "${candidate.parentRouteId}" did not resolve.`,
            );
            invalidModules.add(candidate.moduleId);
            rejected.add(candidate.id);
            changed = true;
          }
          continue;
        }
      }
      accepted.set(candidate.id, candidate);
      changed = true;
    }
  }

  // Anything left pending references a rejected/missing parent.
  for (const candidate of pending) {
    if (accepted.has(candidate.id) || rejected.has(candidate.id)) continue;
    diagnostics.push(
      `[resolveAdminRoutes] Route "${candidate.id}" could not be resolved because its parent is unavailable.`,
    );
    invalidModules.add(candidate.moduleId);
    rejected.add(candidate.id);
  }

  // A parent route failure makes a child module unsafe to merge. This is
  // important for Settings Theme/Business Hours, whose parent is another
  // manifest owner.
  for (const candidate of accepted.values()) {
    if (candidate.parentRouteId && !accepted.has(candidate.parentRouteId)) {
      invalidModules.add(candidate.moduleId);
    }
  }

  // Detect absolute path collisions after parent resolution. The first stable
  // owner wins; the colliding contribution is removed from the render set.
  const pathOwners = new Map<string, string>();
  for (const candidate of [...accepted.values()].sort(sortCandidates)) {
    const parentPath = candidate.parentRouteId
      ? pathOwners.get(candidate.parentRouteId)
      : undefined;
    const fullPath = parentPath
      ? joinPath(parentPath, candidate.path)
      : normalisePath(candidate.path);
    const key = `${candidate.parentRouteId ?? "__root__"}::${candidate.index ? "__index__" : fullPath}`;
    const owner = pathOwners.get(key);
    if (owner && owner !== candidate.id) {
      diagnostics.push(
        `[resolveAdminRoutes] Route path "${fullPath}" collides between "${owner}" and "${candidate.id}".`,
      );
      invalidModules.add(candidate.moduleId);
      accepted.delete(candidate.id);
      continue;
    }
    pathOwners.set(candidate.id, fullPath);
    pathOwners.set(key, candidate.id);
  }

  // A child route cannot survive when its parent module was rejected. This is
  // especially important for Settings Theme/Business Hours, whose parent
  // route is owned by a different manifest.
  let moduleStateChanged = true;
  while (moduleStateChanged) {
    moduleStateChanged = false;
    for (const candidate of accepted.values()) {
      if (!candidate.parentRouteId) continue;
      const parentModuleId = accepted.get(candidate.parentRouteId)?.moduleId;
      if (
        parentModuleId &&
        invalidModules.has(parentModuleId) &&
        !invalidModules.has(candidate.moduleId)
      ) {
        invalidModules.add(candidate.moduleId);
        moduleStateChanged = true;
      }
    }
  }

  const renderableAccepted = new Map(
    [...accepted].filter(([, candidate]) => !invalidModules.has(candidate.moduleId)),
  );

  const depthMemo = new Map<string, number>();
  function depth(id: string, stack = new Set<string>()): number {
    const cached = depthMemo.get(id);
    if (cached !== undefined) return cached;
    if (stack.has(id)) return 0;
    const candidate = renderableAccepted.get(id);
    if (!candidate?.parentRouteId) {
      depthMemo.set(id, 0);
      return 0;
    }
    const nextStack = new Set(stack);
    nextStack.add(id);
    const value = depth(candidate.parentRouteId, nextStack) + 1;
    depthMemo.set(id, value);
    return value;
  }

  const sortedAccepted = [...renderableAccepted.values()].sort((left, right) => {
    const depthDiff = depth(left.id) - depth(right.id);
    return depthDiff || sortCandidates(left, right);
  });

  const routePaths = new Map<string, string>();
  const routes: AdminRouteViewModel[] = [];
  for (const candidate of sortedAccepted) {
    const parentPath = candidate.parentRouteId
      ? routePaths.get(candidate.parentRouteId)
      : undefined;
    const fullPath = parentPath
      ? joinPath(parentPath, candidate.path)
      : normalisePath(candidate.path);
    routePaths.set(candidate.id, fullPath);
    routes.push({
      moduleId: candidate.moduleId,
      id: candidate.id,
      fullPath,
      kind: candidate.kind,
      ...(candidate.index ? {} : { path: candidate.path }),
      ...(candidate.componentId ? { componentId: candidate.componentId } : {}),
      ...(candidate.parentRouteId ? { parentRouteId: candidate.parentRouteId } : {}),
      ...(candidate.index ? { index: true } : {}),
      ...(candidate.to ? { to: candidate.to } : {}),
      ...(candidate.replace !== undefined ? { replace: candidate.replace } : {}),
    });
  }

  const resolvedRouteIds = new Set(routes.map(({ id }) => id));
  const modules = [...knownModules]
    .sort((left, right) => left.localeCompare(right))
    .map((moduleId): AdminRouteModuleResolution => {
      const declared = candidatesByModule.get(moduleId) ?? [];
      const routeIds = routes.filter((route) => route.moduleId === moduleId).map(({ id }) => id);
      const status: AdminRouteModuleStatus =
        declared.length === 0
          ? "absent"
          : invalidModules.has(moduleId) || routeIds.length !== declared.length
            ? "fallback"
            : "resolved";
      return { moduleId, status, routeIds };
    });

  return { routes, diagnostics, modules, routePaths, resolvedRouteIds };
}

export function isAdminRouteModuleResolved(
  resolution: AdminRoutesResolution,
  moduleId: string,
): boolean {
  return resolution.modules.find((module) => module.moduleId === moduleId)?.status === "resolved";
}
