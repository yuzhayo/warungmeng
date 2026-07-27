import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const runtimeSourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const uiAssetExtension = /\.(?:css|scss|less|svg|png|jpe?g)$/i;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "tests" ? [] : sourceFiles(path);
    }
    return runtimeSourceExtensions.has(extname(entry.name)) && !entry.name.endsWith(".d.ts")
      ? [path]
      : [];
  });
}

function moduleSpecifiers(file: string, source: string): readonly string[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === "require")) &&
      node.arguments.length === 1
    ) {
      const [argument] = node.arguments;
      if (argument && ts.isStringLiteralLike(argument)) {
        specifiers.push(argument.text);
      }
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    ) {
      specifiers.push(node.moduleReference.expression.text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function staysInsidePackage(resolvedPath: string): boolean {
  const relativePath = relative(packageRoot, resolvedPath);
  return (
    relativePath === "" ||
    (relativePath !== ".." && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath))
  );
}

function forbiddenModuleSpecifiers(file: string, source: string): readonly string[] {
  return moduleSpecifiers(file, source).filter((specifier) => {
    if (uiAssetExtension.test(specifier) || isAbsolute(specifier)) {
      return true;
    }
    if (!specifier.startsWith(".")) {
      return true;
    }
    return !staysInsidePackage(resolve(dirname(file), specifier));
  });
}

describe("module-system headless boundary", () => {
  it("has no runtime imports from forbidden layers or browser APIs", () => {
    const forbiddenRuntime =
      /\b(?:localStorage|sessionStorage|window|document|fetch|XMLHttpRequest|WebSocket)\b/;
    const violations = sourceFiles(join(packageRoot, "src")).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return [
        ...forbiddenModuleSpecifiers(file, source).map(
          (specifier) => `${relative(packageRoot, file)}: forbidden import "${specifier}"`,
        ),
        ...(forbiddenRuntime.test(source)
          ? [`${relative(packageRoot, file)}: browser runtime`]
          : []),
      ];
    });

    expect(violations).toEqual([]);
  });

  it("rejects imports that escape the package or introduce runtime dependencies", () => {
    const virtualFile = join(packageRoot, "src", "registry", "virtualModule.ts");
    const source = `
      import "../../../apps/admin/foo";
      import "../../../../packages/domain/src/index";
      export { data } from "../../../../packages/data/src/index";
      const i18n = import("../../../../packages/i18n/src/index");
      import { Button } from "antd";
      const react = require("react");
      import fileSystem = require("node:fs");
      import "../styles.css";

      import { moduleId } from "../contracts/moduleId";
      const message = 'import "../../../../apps/storefront/not-an-import"';
    `;

    expect(forbiddenModuleSpecifiers(virtualFile, source)).toEqual([
      "../../../apps/admin/foo",
      "../../../../packages/domain/src/index",
      "../../../../packages/data/src/index",
      "../../../../packages/i18n/src/index",
      "antd",
      "react",
      "node:fs",
      "../styles.css",
    ]);
  });

  it("declares no third-party dependencies or UI assets", () => {
    const packageJson = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const assets = readdirSync(join(packageRoot, "src"), { recursive: true })
      .map(String)
      .filter((path) => uiAssetExtension.test(path));

    expect(packageJson.dependencies).toBeUndefined();
    expect(packageJson.devDependencies).toBeUndefined();
    expect(assets).toEqual([]);
  });
});
