/// <reference types="node" />

import { readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const adminSrc = join(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeExtensions = new Set([".ts", ".tsx"]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return runtimeExtensions.has(extname(entry.name)) && !/\.test\.tsx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

function moduleSpecifiers(file: string): readonly string[] {
  const source = readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];

  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

describe("Admin import boundary", () => {
  it("keeps App.tsx limited to providers, runtime, router, and route composition", () => {
    const appFile = join(adminSrc, "App.tsx");

    expect(moduleSpecifiers(appFile)).toEqual([
      "react-router-dom",
      "./app/AppRoutes",
      "./app/composition/adminRuntime",
      "./app/providers/AdminApplicationProviders",
    ]);
  });

  it("does not import Storefront or frozen module-system internals", () => {
    const violations = sourceFiles(adminSrc).flatMap((file) =>
      moduleSpecifiers(file)
        .filter(
          (specifier) =>
            specifier.includes("apps/storefront") ||
            specifier.includes("packages/module-system") ||
            specifier.startsWith("@warungmeng/storefront"),
        )
        .map((specifier) => `${relative(adminSrc, file)} -> ${specifier}`),
    );

    expect(violations).toEqual([]);
  });

  it("requires Admin composition, discovery, and providers to use Dashboard's public entry", () => {
    const appOwners = ["composition", "discovery", "providers"].flatMap((directory) =>
      sourceFiles(join(adminSrc, "app", directory)),
    );
    const violations = appOwners.flatMap((file) =>
      moduleSpecifiers(file)
        .filter((specifier) => {
          const normalized = specifier.replaceAll("\\", "/");
          return normalized.includes("features/dashboard/");
        })
        .map((specifier) => `${relative(adminSrc, file)} -> ${specifier}`),
    );

    expect(violations).toEqual([]);
  });

  it("prevents features from importing parent app composition", () => {
    const features = join(adminSrc, "features");
    const violations = sourceFiles(features).flatMap((file) =>
      moduleSpecifiers(file)
        .filter((specifier) => specifier.replaceAll("\\", "/").match(/^(?:\.\.\/)+app(?:\/|$)/))
        .map((specifier) => `${relative(adminSrc, file)} -> ${specifier}`),
    );

    expect(violations).toEqual([]);
  });

  it("keeps Dashboard concrete repository wiring in the composition owner only", () => {
    const repositoryOwners = sourceFiles(adminSrc)
      .filter((file) =>
        moduleSpecifiers(file).some((specifier) =>
          [
            "features/orders/application/orderRepository",
            "features/finance/application/financeRepository",
            "features/inventory/application/inventoryRepository",
            "features/menu/application/menuCatalogRepository",
          ].some((repositoryPath) => specifier.includes(repositoryPath)),
        ),
      )
      .map((file) => relative(adminSrc, file));

    expect(repositoryOwners.map((path) => path.replaceAll("\\", "/"))).toEqual([
      "app/composition/createAdminRepositories.ts",
    ]);
  });
});
