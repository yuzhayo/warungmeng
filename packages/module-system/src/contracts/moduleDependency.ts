import type { ModuleId } from "./moduleId";

export interface ModuleDependency {
  readonly moduleId: ModuleId;
  readonly optional?: boolean;
}
