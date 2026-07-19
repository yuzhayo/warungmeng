import { describe, expect, it } from "vitest";
import {
  findScopeViolations,
  isAllowedValidationCommand,
  normalizeAllowedPaths,
} from "./policy.js";

describe("Claude bridge policy", () => {
  it("normalizes repository-relative allowlist paths", () => {
    expect(normalizeAllowedPaths(["./apps/admin", "apps\\admin", "packages/domain/"])).toEqual([
      "apps/admin",
      "packages/domain",
    ]);
  });

  it("rejects path traversal", () => {
    expect(() => normalizeAllowedPaths(["../outside"])).toThrow(/traversal/i);
  });

  it("rejects POSIX, Windows drive, and UNC absolute paths", () => {
    expect(() => normalizeAllowedPaths(["/outside"])).toThrow(/relative path/i);
    expect(() => normalizeAllowedPaths(["C:\\outside"])).toThrow(/relative path/i);
    expect(() => normalizeAllowedPaths(["\\\\server\\share"])).toThrow(/relative path/i);
  });

  it("reports files outside the allowlist", () => {
    expect(
      findScopeViolations(
        ["apps/admin/src/App.tsx", "packages/domain/src/index.ts"],
        ["apps/admin"],
      ),
    ).toEqual(["packages/domain/src/index.ts"]);
  });

  it("allows known validation commands and blocks arbitrary shell commands", () => {
    expect(isAllowedValidationCommand("npm run lint")).toBe(true);
    expect(isAllowedValidationCommand("npm run build --workspace @warungmeng/admin")).toBe(true);
    expect(isAllowedValidationCommand("npx vitest run --maxWorkers=2")).toBe(true);
    expect(isAllowedValidationCommand("npx prettier --check .")).toBe(true);
    expect(isAllowedValidationCommand("Remove-Item -Recurse C:\\")).toBe(false);
    expect(isAllowedValidationCommand("npm run lint\nwhoami")).toBe(false);
    expect(isAllowedValidationCommand("npm run lint && whoami")).toBe(false);
    expect(isAllowedValidationCommand("npm run arbitrary-script")).toBe(false);
    expect(isAllowedValidationCommand("npx eslint . --fix")).toBe(false);
    expect(isAllowedValidationCommand("npx prettier --write .")).toBe(false);
  });
});
