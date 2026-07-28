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

// Forbidden imports that must never appear in a feature manifest file
const MANIFEST_FORBIDDEN_PATTERNS = [
  /^react$/,
  /^react-router-dom$/,
  /^antd$/,
  /^@ant-design\/icons$/,
  /\.css$/,
  /\/screens\//,
  /\/components\//,
  /\/views\//,
];

function manifestFiles(featuresDir: string): string[] {
  return sourceFiles(featuresDir).filter((f) => f.replaceAll("\\", "/").includes("/manifest/"));
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

  it("keeps the Menu compatibility repository wiring in the composition owner only", () => {
    const repositoryOwners = sourceFiles(adminSrc)
      .filter((file) =>
        moduleSpecifiers(file).some((specifier) =>
          specifier.includes("features/menu/application/menuCatalogRepository"),
        ),
      )
      .map((file) => relative(adminSrc, file));

    expect(repositoryOwners.map((path) => path.replaceAll("\\", "/"))).toEqual([
      "app/composition/createAdminRepositories.ts",
    ]);
  });

  // Phase 04 closure scan: no feature may import another feature's internals.
  // Relative specifiers are resolved against the importing file, so any
  // `../../<other-feature>/...` path is caught regardless of depth.
  it("keeps features free of direct internal cross-feature imports", () => {
    const features = join(adminSrc, "features");
    const violations = sourceFiles(features).flatMap((file) => {
      const owner = relative(features, file).replaceAll("\\", "/").split("/")[0];
      return moduleSpecifiers(file)
        .filter((specifier) => specifier.startsWith("."))
        .flatMap((specifier) => {
          const resolved = relative(features, join(dirname(file), specifier)).replaceAll("\\", "/");
          if (resolved.startsWith("..")) return [];
          const target = resolved.split("/")[0];
          return target && target !== owner ? [`${relative(adminSrc, file)} -> ${specifier}`] : [];
        });
    });

    expect(violations).toEqual([]);
  });

  // Architecture guard: manifest files must never import React, Router, AntD,
  // CSS, screens, components, or views. This reads the actual source imports.
  it("feature manifest files do not import React, AntD, Router, CSS, screens, components, or views", () => {
    const features = join(adminSrc, "features");
    const manifests = manifestFiles(features);

    // Must find at least the dashboard manifest
    expect(manifests.length).toBeGreaterThan(0);

    const violations = manifests.flatMap((file) =>
      moduleSpecifiers(file)
        .filter((specifier) =>
          MANIFEST_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(specifier)),
        )
        .map((specifier) => `${relative(adminSrc, file)} -> ${specifier}`),
    );

    expect(violations).toEqual([]);
  });

  // Prove the guard catches violations: a synthetic manifest source with a
  // forbidden import must be detected by the same pattern set.
  it("manifest boundary guard detects forbidden imports (negative proof)", () => {
    const forbiddenSpecifiers = [
      "react",
      "react-router-dom",
      "antd",
      "@ant-design/icons",
      "./DashboardScreen.css",
      "../screens/DashboardScreen",
      "../components/DashboardWidget",
      "../views/DashboardView",
    ];

    for (const specifier of forbiddenSpecifiers) {
      const detected = MANIFEST_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(specifier));
      expect(detected, `Expected "${specifier}" to be detected as forbidden`).toBe(true);
    }
  });
});
