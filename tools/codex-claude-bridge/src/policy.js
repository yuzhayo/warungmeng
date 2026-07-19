import path from "node:path";

const VALIDATION_PATTERNS = [
  /^npm run (?:lint|typecheck|test|build|format:check)(?:\s+.*)?$/u,
  /^npm test(?:\s+.*)?$/u,
  /^npx vitest run(?:\s+.*)?$/u,
  /^npx tsc --noEmit(?:\s+.*)?$/u,
  /^npx eslint(?:\s+.*)?$/u,
  /^npx prettier --check(?:\s+.*)?$/u,
  /^npx -y @ant-design\/cli lint(?:\s+.*)?$/u,
  /^antd lint(?:\s+.*)?$/u,
  /^git diff(?:\s+.*)?$/u,
  /^git status(?:\s+.*)?$/u,
];
const SHELL_CONTROL_PATTERN = /[;&|<>`\r\n]|\$\(|\^\^?/u;
const MUTATING_OPTION_PATTERN = /(?:^|\s)(?:--fix|--write)(?:\s|$)/u;

export function normalizeRepoPath(value) {
  const normalized = value
    .replaceAll("\\", "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "");
  const isWindowsAbsolute = /^[A-Za-z]:\//u.test(normalized);
  if (!normalized || normalized === "." || path.posix.isAbsolute(normalized) || isWindowsAbsolute) {
    throw new Error(`Invalid repository-relative path: ${value}`);
  }
  if (normalized.split("/").includes("..")) {
    throw new Error(`Path traversal is not allowed: ${value}`);
  }
  return normalized;
}

export function normalizeAllowedPaths(paths) {
  return [...new Set(paths.map(normalizeRepoPath))];
}

export function findScopeViolations(changedFiles, allowedPaths) {
  const normalizedAllowed = normalizeAllowedPaths(allowedPaths);
  return changedFiles
    .map(normalizeRepoPath)
    .filter(
      (file) =>
        !normalizedAllowed.some((allowed) => file === allowed || file.startsWith(`${allowed}/`)),
    );
}

export function isAllowedValidationCommand(command) {
  const normalized = command.trim();
  return (
    normalized.length > 0 &&
    !SHELL_CONTROL_PATTERN.test(normalized) &&
    !MUTATING_OPTION_PATTERN.test(normalized) &&
    VALIDATION_PATTERNS.some((pattern) => pattern.test(normalized))
  );
}
