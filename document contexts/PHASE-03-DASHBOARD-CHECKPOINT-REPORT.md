# Warung Meng — Phase 03 Evidence Report

**Verdict:** PASS — supervisor-reviewed 28 Juli 2026. All Phase 03 implementation
checkpoints and final integration gates are green; canonical phase status, evidence,
and ledger entries are now closed.

**Date:** 2026-07-28
**Executor:** Codex
**Commit/push:** Not performed

## 1. Scope and checkpoint result

| Checkpoint                                   | Result | Evidence                                               |
| -------------------------------------------- | ------ | ------------------------------------------------------ |
| 03.0 Navigation ID/EN parity                 | PASS   | `apps/admin/src/app/navigation.test.tsx`               |
| 03.1 Dashboard manifest + declarative routes | PASS   | Dashboard manifest and route resolver tests            |
| 03.2 Menu manifest + extension               | PASS   | Menu manifest, route and navigation tests              |
| 03.3 Finance manifest + extension            | PASS   | Finance manifest and route tests                       |
| 03.4 Inventory manifest + extension          | PASS   | Inventory manifest, HPP, and calculator redirect tests |
| 03.5 Orders manifest + extension             | PASS   | Orders list/detail route tests                         |
| 03.6 POS manifest + extension                | PASS   | POS route and browser checks                           |
| 03.7 Settings parent/Theme/Business Hours    | PASS   | Nested route, tab, and active-state checks             |
| 03.8 Integration and final validation        | PASS   | Full test, lint, typecheck, build, and Browser QA      |

## 2. Architecture delivered

- Each Admin module now owns serializable manifest metadata for navigation,
  routes, redirects, translation keys, order, icon IDs, and component IDs.
- Public feature entries expose the manifest and extension factory:
  `apps/admin/src/features/*/index.ts`.
- `adminRouteComponentRegistry.ts` owns React/lazy component resolution.
- `adminIconRegistry.tsx` owns concrete Ant Design icons.
- `resolveAdminRoutes.ts` builds a deterministic parent-before-child route
  tree, validates duplicate IDs/path collisions, missing parents, cycles,
  unknown components, and wrong surfaces.
- `resolveAdminNavigation.ts` builds the menu view model from contributions,
  validates route/icon/label/parent references, and rejects a broken module
  atomically while preserving valid siblings.
- `resolveAdminRoutes.ts` rejects duplicate sibling route paths atomically; the
  owning module cannot leave a live navigation item pointing at a discarded route.
- `adminBuiltInManifests.ts` is the feature-owned fallback set used when a
  runtime candidate is absent. The old hardcoded navigation list and its
  consumers were removed.
- Settings remains one clickable sidebar item; Theme and Business Hours are
  declarative child routes rendered by the existing Settings tabs. This
  preserves the established UI behavior and avoids turning Settings into an
  AntD submenu.
- The manifest-owned `/calculator → /inventory` redirect and the existing
  catch-all `* → /` platform fallback were both verified. The catch-all is
  intentionally app-shell-owned; feature-owned redirects resolve from manifests.

## 3. Changed and created source

### App composition and resolvers

- `apps/admin/src/app/AppRoutes.tsx`
- `apps/admin/src/app/discovery/adminModuleCandidates.ts`
- `apps/admin/src/app/discovery/adminBuiltInManifests.ts`
- `apps/admin/src/app/navigation.tsx`
- `apps/admin/src/app/navigation/adminIconRegistry.tsx`
- `apps/admin/src/app/navigation/adminNavigationViewModel.ts`
- `apps/admin/src/app/navigation/resolveAdminNavigation.ts`
- `apps/admin/src/app/routing/adminRouteComponentRegistry.ts`
- `apps/admin/src/app/routing/resolveAdminRoutes.ts`
- `apps/admin/src/components/layout/AdminShell.tsx`

### Feature manifests and extensions

- `apps/admin/src/features/dashboard/manifest/dashboardManifest.ts`
- `apps/admin/src/features/menu/{index.ts,manifest/*}`
- `apps/admin/src/features/settings/{index.ts,manifest/*,theme/manifest/*,business-hours/manifest/*}`
- `apps/admin/src/features/inventory/{index.ts,manifest/*}`
- `apps/admin/src/features/finance/{index.ts,manifest/*}`
- `apps/admin/src/features/pos/{index.ts,manifest/*}`
- `apps/admin/src/features/orders/{index.ts,manifest/*}`

### Tests

- `apps/admin/src/app/navigation.test.tsx`
- `apps/admin/src/components/layout/AdminShell.test.tsx`
- `apps/admin/src/tests/adminImportBoundary.test.ts`
- `apps/admin/src/tests/adminNavigationContributions.test.ts`
- `apps/admin/src/tests/adminRouteContributions.test.tsx`
- `apps/admin/src/tests/adminLiveIntegration.test.tsx`
- `apps/admin/src/App.test.tsx` (default candidate registration expectation)

No files under `packages/**` or `apps/storefront/**` were changed. No feature
application logic, components, views, screens, or CSS were changed.

## 4. Automated gates

| Command                                                    | Result                          |
| ---------------------------------------------------------- | ------------------------------- |
| `npm run format:check`                                     | PASS                            |
| `npm run lint`                                             | PASS                            |
| `npm run typecheck`                                        | PASS — all workspaces           |
| `npx -y @ant-design/cli lint apps/admin/src --format json` | PASS — 0 issues                 |
| `npm run test -- --maxWorkers=2`                           | PASS — 103 files, 724/724 tests |
| `npm run build`                                            | PASS — Admin and Storefront     |
| `git diff --check`                                         | PASS                            |

Additional targeted route/navigation validation passed:
`npm run test -- apps/admin/src/tests/adminRouteContributions.test.tsx
apps/admin/src/tests/adminNavigationContributions.test.ts --maxWorkers=2`
— 47 tests, including the duplicate-path atomicity proof.

## 5. Browser QA

Validated with direct Playwright against `http://localhost:3000`:

- Desktop `1024×768`: seven registry-driven sidebar items in the established
  order; all affected routes render; no document overflow.
- Mobile `375×812`: `clientWidth=360` and `scrollWidth=360` (the 15px
  difference from viewport width is the native scrollbar); collapsed sidebar
  has no visible/tabbable menu content; expanding it exposes all seven items.
- Route/deep-link matrix passed:
  `/`, `/reports`, `/menu`, `/menu/variants`, `/menu/new`, `/finance`,
  `/finance/overview`, `/finance/transactions`, `/finance/expenses`,
  `/inventory`, `/inventory/movements`, `/inventory/hpp`, `/calculator`,
  `/pos`, `/orders`, `/orders/order-1008`, `/settings`,
  `/settings/theme`, `/settings/business-hours`, and an unknown path.
- Redirect evidence: `/finance → /finance/overview`, `/settings → /settings/theme`,
  `/calculator → /inventory`, unknown path → `/`.
- Settings remains selected on both child routes; ID/EN switching preserves the
  same contribution graph and labels.
- Keyboard focus indicator was visible as a 3px outline; console errors and
  warnings were both zero.

Screenshot evidence was retained outside the repository at:

`C:\Users\YUZHA\AppData\Local\Temp\warungmeng-phase03-final\`

A fresh browser connection was attempted during supervisor closure but no browser
backend was available in the current session. The final source fix only affects
malformed duplicate-path manifests; the valid built-in graph exercised by the
recorded Playwright matrix is unchanged.

## 6. Scope notes

`adminModuleCandidates.ts`, `adminBuiltInManifests.ts`, and the default
candidate expectation in `App.test.tsx` were required to wire all Phase 03
modules and preserve degraded-startup behavior. They are app discovery/test
composition support, not feature business logic. The canonical plan remains
unchanged.

The working tree is intentionally uncommitted for supervisor review. The canonical
phase plan, evidence, and ledger were updated for closure; no source or documentation
was committed or pushed. Phase 04 remains `PENDING`.

## 7. Supervisor handoff

| Field                              | Phase 03 closure                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Phase / sub-waves                  | 03.0 navigation parity through 03.8 integration                                                                                               |
| Baseline HEAD                      | `main` at `2956444c06a2d541303da9ccd7b3bfc015f30990`                                                                                          |
| Allowed files                      | Phase 03 allowlist plus the documented discovery/integration scope amendment in `PHASE-PLAN.md` §8.3                                          |
| Forbidden-file check               | PASS — no `apps/storefront/**`, `packages/**`, feature application/components/views/screens, or CSS changed                                   |
| Ledger/evidence rows               | Nine Admin module rows plus Admin route/navigation cutover rows set to `verified`                                                             |
| Compatibility path                 | Built-in manifest fallback, app-local registries, and app-shell catch-all remain reversible                                                   |
| Characterization / fail-on-removal | ID/EN transitive removal tests; route/nav duplicate, parent, cycle, icon, component, and surface diagnostics                                  |
| Reviewer finding                   | Duplicate sibling route path could expose a dead navigation item; fixed with atomic module rejection and red/green proof                      |
| Legacy consumers remaining         | No legacy route/nav metadata consumer; physical `AppRoutes.tsx`/`navigation.tsx` filenames and feature UI remain as compatibility-owned paths |
| Rollback / remediation             | Revert the uncommitted Phase 03 source set as one review unit; no destructive cleanup performed                                               |
| Final git status                   | Dirty by intentional Phase 03 source + context changes; no unrelated root artifacts                                                           |
| Commit / push                      | Not performed; no authorization requested                                                                                                     |
| Next safe action                   | User review/sign-off, then separately authorize Phase 04 kickoff                                                                              |
