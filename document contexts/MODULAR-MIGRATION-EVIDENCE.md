# Warung Meng — Modular Migration Evidence

> Phase evidence and parity results for the Plug-and-Play Modular refactor.
> Companion to `MODULAR-MIGRATION-LEDGER.md` (current → target map). This file records
> **what was actually verified** as each vertical module moves through the waves.
>
> Scope note: `.docs/` is Git-ignored but canonical-local (see `ARCHITECTURE.md` §2).
> Do not treat an empty cell as "done". Only rows with a concrete evidence path and a
> `verified` status are considered cut over.

## 1. How to Use

1. Pick one vertical module for the active wave (never big-bang — `RULES.md` §7).
2. Confirm the module's ledger rows and target/action before touching source.
3. Add missing characterization tests first; prove they fail if protected behavior is
   removed (`RULES.md` §4).
4. Record every gate result below with a command + outcome + date, not a claim.
5. Advance the ledger status only when the evidence here supports it.

## 2. Status Contract (mirror of ledger)

`unmapped → mapped → scaffolded → wired → verified → retired`

- `mapped` rows are planning evidence, **not** a validation PASS.
- A legacy path is removed only after its row is `verified` and no consumer remains.

## 3. Gate Legend

Per `CLAUDE.md` Commands and `RULES.md` §4. Record the exact command and result.

| Gate       | Command                                                    |
| ---------- | ---------------------------------------------------------- |
| lint       | `npm run lint`                                             |
| typecheck  | `npm run typecheck`                                        |
| test       | `npm run test -- --maxWorkers=2`                           |
| build      | `npm run build`                                            |
| antd lint  | `npx -y @ant-design/cli lint apps/admin/src --format json` |
| browser QA | Playwright evidence (breakpoints + checkpoints)            |

## 4. Baseline

| Item                        | Value                                                |
| --------------------------- | ---------------------------------------------------- |
| Baseline commit             | `45d20dfbc1d494d4e9e255a105184b0147a5dcb9`           |
| Baseline lint               | PASS — accepted Phase 00 input, 26 Juli 2026         |
| Baseline typecheck          | PASS — accepted Phase 00 input, 26 Juli 2026         |
| Baseline test (files/tests) | PASS — 92 files / 581 tests, accepted Phase 00 input |
| Baseline build              | PASS — accepted Phase 00 input, 26 Juli 2026         |

## 5. Evidence by Wave

Fill one module block per row as it moves. Leave `—` until real evidence exists.

### Wave 00 — protect / reuse (characterization safety net)

| Module / area | Characterization added | Fail-on-removal proven | Gate result | Status | Evidence path |
| ------------- | ---------------------- | ---------------------- | ----------- | ------ | ------------- |
| _module_      | —                      | —                      | —           | mapped | —             |

### Wave 01 — headless module contracts

| Module / area               | Public contract | Contract/boundary tests | Gate result                                               | Status   | Evidence path                                                 |
| --------------------------- | --------------- | ----------------------- | --------------------------------------------------------- | -------- | ------------------------------------------------------------- |
| `@warungmeng/module-system` | Complete        | 5 files / 38 tests PASS | Full gates PASS; 619/619 twice + final-state confirmation | verified | `packages/module-system/**`; `document contexts/report p1.md` |

### Wave 02 — Admin registry skeleton + Dashboard pilot

| Module / area             | Manifest/extension wired                                        | Parity vs legacy                                                        | Gate result                                                               | Status   | Evidence path                                        |
| ------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| Admin runtime + Dashboard | Complete — `admin.dashboard` + `reporting.read` registered once | PASS — Dashboard output, routes, repositories, lifecycle, and a11y kept | Final-state automated gates + supervisor browser matrix PASS, 28 Jul 2026 | verified | Commit `60e380f`; Wave 02 gate/browser records below |

#### Wave 02 final-state gate record — 28 Juli 2026

All commands below were rerun on clean HEAD after the two unrelated local test-timeout
changes were removed.

| Gate                                | Exact command                                                                                                                                                                                                                                                                                        | Result                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Target runtime/Dashboard/a11y tests | `npm run test -- apps/admin/src/App.test.tsx apps/admin/src/tests/adminModuleDiscovery.test.ts apps/admin/src/tests/adminImportBoundary.test.ts apps/admin/src/features/dashboard/application/useDashboardReportData.test.tsx apps/admin/src/components/layout/AdminSidebar.test.tsx --maxWorkers=2` | PASS — 5 files / 36 tests    |
| Format                              | `npm run format:check`                                                                                                                                                                                                                                                                               | PASS                         |
| Lint                                | `npm run lint`                                                                                                                                                                                                                                                                                       | PASS                         |
| Typecheck                           | `npm run typecheck`                                                                                                                                                                                                                                                                                  | PASS — all workspaces        |
| Full test                           | `npm run test -- --maxWorkers=2`                                                                                                                                                                                                                                                                     | PASS — 100 files / 639 tests |
| Build                               | `npm run build`                                                                                                                                                                                                                                                                                      | PASS — Admin + Storefront    |
| Admin AntD lint                     | `npx -y @ant-design/cli lint apps/admin/src --format json`                                                                                                                                                                                                                                           | PASS — 0 issues, 0 skipped   |
| Diff integrity                      | `git diff --check`                                                                                                                                                                                                                                                                                   | PASS                         |

#### Wave 02 browser parity record — 28 Juli 2026

Browser QA was supervisor-observed against the source state committed as `60e380f`.

| Scenario                                                              | `1024×768`                                | `375×812`                                                                  | Result |
| --------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------- | ------ |
| `/` Dashboard overview and `/reports`                                 | Rendered and interactive                  | Rendered and interactive                                                   | PASS   |
| Period/report URL search and unrelated `source=qa` query preservation | Preserved                                 | Preserved                                                                  | PASS   |
| Direct route, reload, and history behavior                            | Preserved                                 | Preserved                                                                  | PASS   |
| Indonesian/English labels and business formatting                     | Stable                                    | Stable                                                                     | PASS   |
| Keyboard focus and collapsed-sidebar tab order                        | Visible; desktop collapse preserved       | Hidden collapsed menu removed from tab order; period control focus visible | PASS   |
| Console and horizontal overflow                                       | 0 errors/warnings; no horizontal overflow | 0 errors/warnings; no horizontal overflow                                  | PASS   |

The 23 root-level Playwright PNG working artifacts (`phase-02-*.png` and
`phase02-*.png`) were reviewed by the supervisor and then intentionally deleted before
checkpoint at the user's cleanup request. The canonical textual result is retained here;
the deleted PNGs are not claimed as currently available artifacts.

Approved scope amendment: `AdminSidebar.tsx` and `AdminSidebar.test.tsx` were allowed
after Browser QA found the collapsed mobile menu remained tabbable. The surgical fix
removes the hidden menu from the mobile collapsed render path while preserving desktop
collapsed navigation. No route/navigation metadata, Dashboard screen/component/view, or
shared package was changed by this amendment.

### Wave 03 — Admin declarative modules (routes + navigation)

| Module / area | Route/nav from manifest | Parity vs legacy | Gate result | Status | Evidence path |
| ------------- | ----------------------- | ---------------- | ----------- | ------ | ------------- |
| _module_      | —                       | —                | —           | mapped | —             |

### Wave 04 — Admin cross-domain modules (orders/finance/inventory/pos)

| Module / area | Cross-domain workflow preserved | Idempotency proven | Gate result | Status | Evidence path |
| ------------- | ------------------------------- | ------------------ | ----------- | ------ | ------------- |
| _module_      | —                               | —                  | —           | mapped | —             |

### Wave 05 — Storefront (registry / catalog / transaction flow)

| Module / area | Manifest/extension wired | Browser parity (375×812 / 1024×768) | Gate result | Status | Evidence path |
| ------------- | ------------------------ | ----------------------------------- | ----------- | ------ | ------------- |
| _module_      | —                        | —                                   | —           | mapped | —             |

## 6. Protected Cross-Domain Workflows (must stay green)

Per `LEDGER` §3 and `PRD.md` §4. Record parity evidence before any cutover touches these.

| Workflow                                                             | Evidence path                                  | Status   |
| -------------------------------------------------------------------- | ---------------------------------------------- | -------- |
| Cancel paid order → refund + inventory reversal (atomic, idempotent) | —                                              | mapped   |
| Cancel unpaid order → no refund/reversal                             | —                                              | mapped   |
| POS session persistence + cash reconciliation                        | —                                              | mapped   |
| i18n ID/EN key parity                                                | —                                              | mapped   |
| Rupiah formatting stability                                          | —                                              | mapped   |
| Dashboard/reporting period consistency                               | Wave 02 gate/browser records; commit `60e380f` | verified |

## 7. Cutover Log

Append-only. One line per module reaching `verified` or `retired`.

| Date         | Module                      | Action                           | Gate summary                                                                           | Legacy removed? | Rollback note                                                       |
| ------------ | --------------------------- | -------------------------------- | -------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------- |
| 27 Juli 2026 | `@warungmeng/module-system` | Phase 01 contracts verified      | Format/lint/typecheck/build PASS; 619 tests PASS × 2 + final-state confirmation        | No              | Package remains app-unwired; omit registration/composition          |
| 28 Juli 2026 | Admin runtime + Dashboard   | Phase 02 registry pilot verified | Format/lint/typecheck/build/AntD PASS; 36 target + 639 full tests; browser matrix PASS | No              | Dispose runtime/bindings and retain legacy route/navigation sources |
