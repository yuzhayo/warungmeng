import type { CapabilityId, ComponentId, ContributionId } from "./moduleId";

export interface ModuleContributionBase {
  readonly id: ContributionId;
  readonly order: number;
}

export interface ModuleNavigationContribution extends ModuleContributionBase {
  readonly kind: "navigation";
  readonly labelKey: string;
  readonly routeId: ContributionId;
  readonly iconId?: string;
  readonly parentId?: ContributionId;
}

export interface ModuleRouteContribution extends ModuleContributionBase {
  readonly kind: "route";
  readonly path: string;
  readonly componentId: ComponentId;
  readonly parentRouteId?: ContributionId;
  readonly index?: boolean;
}

export interface ModuleRedirectContribution extends ModuleContributionBase {
  readonly kind: "redirect";
  readonly path: string;
  readonly to: string;
  readonly replace?: boolean;
}

export interface ModuleActionContribution extends ModuleContributionBase {
  readonly kind: "action";
  readonly labelKey: string;
  readonly placement: string;
  readonly requiredCapability?: CapabilityId;
}

export interface ModuleTabContribution extends ModuleContributionBase {
  readonly kind: "tab";
  readonly labelKey: string;
  readonly parentId: ContributionId;
  readonly routeId: ContributionId;
}

export type ModuleContribution =
  | ModuleNavigationContribution
  | ModuleRouteContribution
  | ModuleRedirectContribution
  | ModuleActionContribution
  | ModuleTabContribution;
