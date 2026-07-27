import type { WarungMengExtension } from "../contracts/moduleExtension";

export interface ModuleCandidate {
  readonly source: string;
  load(): unknown | Promise<unknown>;
}

export interface ValidatedModuleCandidate {
  readonly source: string;
  readonly extension: WarungMengExtension;
}
