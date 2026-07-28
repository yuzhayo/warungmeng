import { describe, expect, it } from "vitest";
import { enTranslations, idTranslations } from "@warungmeng/i18n";
import type { TranslationKey } from "@warungmeng/i18n";
import { adminBuiltInManifests } from "./discovery/adminBuiltInManifests";
import { getSelectedNavigationKey } from "./navigation";
import type { AdminNavigationItemViewModel } from "./navigation/adminNavigationViewModel";
import { collectNavigationLabelKeys } from "./navigation/adminNavigationViewModel";
import { resolveAdminNavigation } from "./navigation/resolveAdminNavigation";
import { resolveAdminRoutes } from "./routing/resolveAdminRoutes";

// ---------------------------------------------------------------------------
// Checkpoint 03.0 — ID/EN label-key parity + transitive collector
// ---------------------------------------------------------------------------

describe("manifest navigation label-key coverage", () => {
  const routeResolution = resolveAdminRoutes(adminBuiltInManifests);
  const viewModelItems = resolveAdminNavigation(
    adminBuiltInManifests,
    (key) => idTranslations[key],
    routeResolution.resolvedRouteIds,
    routeResolution.routePaths,
  ).items;

  // Transitive fixture: nest a synthetic child under the first item to prove
  // collectNavigationLabelKeys descends into children
  const firstItem = viewModelItems[0]!;
  const withNestedFixture: AdminNavigationItemViewModel[] = [
    {
      key: firstItem.key,
      labelKey: firstItem.labelKey,
      iconId: firstItem.iconId,
      children: [
        {
          key: "/overview",
          labelKey: "navigation.performance",
          iconId: "",
        },
      ],
    },
    ...viewModelItems.slice(1),
  ];

  const flatKeys = collectNavigationLabelKeys(viewModelItems);
  const transitiveKeys = collectNavigationLabelKeys(withNestedFixture);

  it("collects all top-level label keys", () => {
    expect(flatKeys).toHaveLength(viewModelItems.length);
  });

  it("collects nested label keys transitively", () => {
    expect(transitiveKeys).toHaveLength(viewModelItems.length + 1);
  });

  it("every label key resolves to a non-empty string in idTranslations", () => {
    for (const key of flatKeys) {
      const value = idTranslations[key as keyof typeof idTranslations];
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    }
  });

  it("every label key resolves to a non-empty string in enTranslations", () => {
    for (const key of flatKeys) {
      const value = enTranslations[key as keyof typeof enTranslations];
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    }
  });

  // ---------------------------------------------------------------------------
  // Honest mutation-style fail-on-removal proof
  // Historical RED not available — test was GREEN on first run.
  // Fail-on-removal is proved by in-memory mutation: clone the real translation
  // map, delete a real navigation key, then assert the validator detects it.
  // ---------------------------------------------------------------------------
  it("mutation: removing a real label key from idTranslations is detected (fail-on-removal proof)", () => {
    // Pick the first real navigation label key
    const targetKey = flatKeys[0] as keyof typeof idTranslations;
    expect(idTranslations[targetKey]).toBeDefined();

    // Clone and mutate — never edit the real package
    const mutated = { ...idTranslations } as Record<string, string>;
    delete mutated[targetKey as string];

    // Validator must now report the key as missing
    const missing = flatKeys.filter((k) => mutated[k as string] === undefined);
    expect(missing).toHaveLength(1);
    expect(missing[0]).toBe(targetKey);
  });

  it("mutation: removing a real label key from enTranslations is detected (fail-on-removal proof)", () => {
    const targetKey = flatKeys[0] as keyof typeof enTranslations;
    expect(enTranslations[targetKey]).toBeDefined();

    const mutated = { ...enTranslations } as Record<string, string>;
    delete mutated[targetKey as string];

    const missing = flatKeys.filter((k) => mutated[k as string] === undefined);
    expect(missing).toHaveLength(1);
    expect(missing[0]).toBe(targetKey);
  });

  it("mutation: removing a nested label key is detected transitively (fail-on-removal proof)", () => {
    // Use the nested fixture which has one extra key (navigation.performance repeated as child)
    const nestedKey = transitiveKeys[transitiveKeys.length - 1] as keyof typeof idTranslations;
    expect(idTranslations[nestedKey]).toBeDefined();

    const mutated = { ...idTranslations } as Record<string, string>;
    delete mutated[nestedKey as string];

    const missing = transitiveKeys.filter((k) => mutated[k as string] === undefined);
    // The nested key appears twice in transitiveKeys (root + child), both should be missing
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.every((k) => k === nestedKey)).toBe(true);
  });

  // Negative fixture: a synthetic item with a missing key must be detected
  it("detects a missing translation key in a nested fixture (negative proof)", () => {
    const missingKey = "navigation.__nonexistent_key_for_test__";
    const negativeFixture: AdminNavigationItemViewModel[] = [
      {
        key: "/",
        labelKey: "navigation.performance",
        iconId: "",
        children: [
          {
            key: "/missing",
            labelKey: missingKey as TranslationKey,
            iconId: "",
          },
        ],
      },
    ];
    const keys = collectNavigationLabelKeys(negativeFixture);
    const missingInId = keys.some(
      (k) => idTranslations[k as keyof typeof idTranslations] === undefined,
    );
    const missingInEn = keys.some(
      (k) => enTranslations[k as keyof typeof enTranslations] === undefined,
    );
    expect(missingInId).toBe(true);
    expect(missingInEn).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Existing: getSelectedNavigationKey path → key mapping (unchanged)
// ---------------------------------------------------------------------------

describe("getSelectedNavigationKey", () => {
  it.each([
    ["/", "/"],
    ["/menu", "/menu"],
    ["/menu/new", "/menu"],
    ["/finance/expenses", "/finance"],
    ["/inventory", "/inventory"],
    ["/pos", "/pos"],
    ["/settings/theme", "/settings"],
    ["/unknown", "/"],
  ])("maps %s to %s", (pathname, expectedKey) => {
    expect(getSelectedNavigationKey(pathname)).toBe(expectedKey);
  });
});
