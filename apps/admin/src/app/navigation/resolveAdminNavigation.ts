import type {
  ModuleNavigationContribution,
  WarungMengModuleManifest,
} from "@warungmeng/module-system";
import type { TranslationKey } from "@warungmeng/i18n";
import { adminBuiltInManifests } from "../discovery/adminBuiltInManifests";
import { resolveAdminRoutes } from "../routing/resolveAdminRoutes";
import { getNavIcon } from "./adminIconRegistry";
import type { AdminNavigationItemViewModel } from "./adminNavigationViewModel";

export type AdminNavigationModuleStatus = "resolved" | "fallback" | "absent";

export interface AdminNavigationModuleResolution {
  readonly moduleId: string;
  readonly status: AdminNavigationModuleStatus;
  readonly contributionIds: readonly string[];
}

export interface AdminNavigationResolution {
  readonly items: readonly AdminNavigationItemViewModel[];
  readonly diagnostics: readonly string[];
  readonly modules: readonly AdminNavigationModuleResolution[];
}

interface NavigationRecord {
  readonly moduleId: string;
  readonly contribution: ModuleNavigationContribution;
}

function navigationContributions(
  manifest: WarungMengModuleManifest,
): readonly ModuleNavigationContribution[] {
  return (manifest.contributions ?? [])
    .filter(
      (contribution): contribution is ModuleNavigationContribution =>
        contribution.kind === "navigation",
    )
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
}

function flatten(items: readonly AdminNavigationItemViewModel[]): AdminNavigationItemViewModel[] {
  return items.flatMap((item) => [item, ...(item.children ? flatten(item.children) : [])]);
}

function createDefaultPathItems(): readonly AdminNavigationItemViewModel[] {
  const routeResolution = resolveAdminRoutes(adminBuiltInManifests);

  return adminBuiltInManifests
    .flatMap((manifest) =>
      navigationContributions(manifest).flatMap((contribution) => {
        const key = routeResolution.routePaths.get(contribution.routeId);
        return key
          ? [
              {
                moduleId: manifest.id,
                key,
                labelKey: contribution.labelKey as TranslationKey,
                iconId: contribution.iconId ?? "",
                order: contribution.order,
                routeId: contribution.routeId,
              },
            ]
          : [];
      }),
    )
    .sort(
      (left, right) => (left.order ?? 0) - (right.order ?? 0) || left.key.localeCompare(right.key),
    );
}

const defaultPathItems = createDefaultPathItems();

/**
 * Resolves serializable manifest contributions into an app-local menu model.
 *
 * The resolver is intentionally pure with respect to fallback selection:
 * callers decide which manifests are active. A module with one invalid
 * navigation contribution is rejected atomically, while unrelated modules
 * remain available.
 */
export function resolveAdminNavigation(
  manifests: readonly WarungMengModuleManifest[],
  translate: (key: TranslationKey) => string,
  resolvedRouteIds?: ReadonlySet<string>,
  resolvedRoutePaths?: ReadonlyMap<string, string>,
): AdminNavigationResolution {
  const diagnostics: string[] = [];
  const diagnosticKeys = new Set<string>();
  const manifestById = new Map<string, WarungMengModuleManifest>();
  const invalidModules = new Set<string>();

  function report(message: string): void {
    if (diagnosticKeys.has(message)) return;
    diagnosticKeys.add(message);
    diagnostics.push(message);
  }

  for (const manifest of manifests) {
    if (manifestById.has(manifest.id)) {
      report(
        `[resolveAdminNavigation] Duplicate manifest "${manifest.id}". Keeping the first manifest.`,
      );
      continue;
    }
    manifestById.set(manifest.id, manifest);
    if (manifest.surface !== "admin") {
      report(
        `[resolveAdminNavigation] Manifest "${manifest.id}" has surface "${manifest.surface}", expected "admin".`,
      );
      invalidModules.add(manifest.id);
    }
  }

  const routeResolution = resolveAdminRoutes([...manifestById.values()]);
  const routeIds = resolvedRouteIds ?? routeResolution.resolvedRouteIds;
  const routePaths = resolvedRoutePaths ?? routeResolution.routePaths;
  const records = [...manifestById.values()]
    .filter(({ surface }) => surface === "admin")
    .flatMap((manifest) =>
      navigationContributions(manifest).map((contribution): NavigationRecord => ({
        moduleId: manifest.id,
        contribution,
      })),
    )
    .sort(
      (left, right) =>
        left.contribution.order - right.contribution.order ||
        left.contribution.id.localeCompare(right.contribution.id),
    );

  const recordById = new Map<string, NavigationRecord>();
  for (const record of records) {
    const existing = recordById.get(record.contribution.id);
    if (existing) {
      report(
        `[resolveAdminNavigation] Duplicate navigation ID "${record.contribution.id}" in modules "${existing.moduleId}" and "${record.moduleId}".`,
      );
      invalidModules.add(record.moduleId);
      if (existing.moduleId === record.moduleId) invalidModules.add(existing.moduleId);
      continue;
    }
    recordById.set(record.contribution.id, record);
  }

  for (const record of recordById.values()) {
    const { contribution, moduleId } = record;
    if (!routeIds.has(contribution.routeId) || !routePaths.has(contribution.routeId)) {
      report(
        `[resolveAdminNavigation] Module "${moduleId}" contribution "${contribution.id}" references unresolved route "${contribution.routeId}".`,
      );
      invalidModules.add(moduleId);
    }
    if (contribution.iconId && !getNavIcon(contribution.iconId)) {
      report(
        `[resolveAdminNavigation] Module "${moduleId}" contribution "${contribution.id}" references unknown icon "${contribution.iconId}".`,
      );
      invalidModules.add(moduleId);
    }
    if (!translate(contribution.labelKey as TranslationKey).trim()) {
      report(
        `[resolveAdminNavigation] Module "${moduleId}" contribution "${contribution.id}" has an empty label.`,
      );
      invalidModules.add(moduleId);
    }
    if (contribution.parentId && !recordById.has(contribution.parentId)) {
      report(
        `[resolveAdminNavigation] Contribution "${contribution.id}" references missing parent "${contribution.parentId}".`,
      );
      invalidModules.add(moduleId);
    }
  }

  const visitState = new Map<string, "visiting" | "visited">();
  const stack: string[] = [];
  function visit(id: string): void {
    const state = visitState.get(id);
    if (state === "visited") return;
    if (state === "visiting") {
      const cycleStart = stack.indexOf(id);
      const cycle = cycleStart >= 0 ? stack.slice(cycleStart) : [id];
      for (const cycleId of cycle) {
        const owner = recordById.get(cycleId)?.moduleId;
        if (owner) invalidModules.add(owner);
      }
      report(`[resolveAdminNavigation] Navigation parent cycle detected at "${id}".`);
      return;
    }

    visitState.set(id, "visiting");
    stack.push(id);
    const parentId = recordById.get(id)?.contribution.parentId;
    if (parentId && recordById.has(parentId)) visit(parentId);
    stack.pop();
    visitState.set(id, "visited");
  }
  for (const id of recordById.keys()) visit(id);

  // Parent/child navigation is an atomic dependency. If a parent module is
  // rejected, its descendant module cannot remain as an orphan.
  let changed = true;
  while (changed) {
    changed = false;
    for (const record of recordById.values()) {
      const parentId = record.contribution.parentId;
      if (!parentId) continue;
      const parentOwner = recordById.get(parentId)?.moduleId;
      if (parentOwner && invalidModules.has(parentOwner) && !invalidModules.has(record.moduleId)) {
        invalidModules.add(record.moduleId);
        changed = true;
      }
    }
  }

  const acceptedById = new Map(
    [...recordById].filter(([, record]) => !invalidModules.has(record.moduleId)),
  );
  const childrenByParent = new Map<string, string[]>();
  const topLevelIds: string[] = [];
  for (const [id, record] of acceptedById) {
    const parentId = record.contribution.parentId;
    if (parentId && acceptedById.has(parentId)) {
      const children = childrenByParent.get(parentId) ?? [];
      children.push(id);
      childrenByParent.set(parentId, children);
    } else {
      topLevelIds.push(id);
    }
  }

  function compareIds(leftId: string, rightId: string): number {
    const left = acceptedById.get(leftId)!.contribution;
    const right = acceptedById.get(rightId)!.contribution;
    return left.order - right.order || left.id.localeCompare(right.id);
  }

  function toViewModel(id: string): AdminNavigationItemViewModel {
    const record = acceptedById.get(id)!;
    const contribution = record.contribution;
    const childIds = (childrenByParent.get(id) ?? []).sort(compareIds);
    return {
      moduleId: record.moduleId,
      key: routePaths.get(contribution.routeId)!,
      labelKey: contribution.labelKey as TranslationKey,
      iconId: contribution.iconId ?? "",
      order: contribution.order,
      routeId: contribution.routeId,
      ...(childIds.length > 0 ? { children: childIds.map((childId) => toViewModel(childId)) } : {}),
    };
  }

  const items = topLevelIds.sort(compareIds).map((id) => toViewModel(id));
  const modules = [...manifestById.values()]
    .map((manifest): AdminNavigationModuleResolution => {
      const contributions = navigationContributions(manifest);
      const status: AdminNavigationModuleStatus = invalidModules.has(manifest.id)
        ? "fallback"
        : contributions.length > 0
          ? "resolved"
          : "absent";
      return {
        moduleId: manifest.id,
        status,
        contributionIds: contributions.map(({ id }) => id),
      };
    })
    .sort((left, right) => left.moduleId.localeCompare(right.moduleId));

  return { items, diagnostics, modules };
}

export function getAdminNavigationSelectedKey(
  pathname: string,
  items: readonly AdminNavigationItemViewModel[] = defaultPathItems,
): string {
  const matches = flatten(items)
    .filter(
      (item) => item.key !== "/" && (pathname === item.key || pathname.startsWith(`${item.key}/`)),
    )
    .sort((left, right) => right.key.length - left.key.length);
  return matches[0]?.key ?? "/";
}
