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

| Gate        | Command                                             |
| ----------- | --------------------------------------------------- |
| lint        | `npm run lint`                                      |
| typecheck   | `npm run typecheck`                                 |
| test        | `npm run test -- --maxWorkers=2`                    |
| build       | `npm run build`                                     |
| antd lint   | `npx -y @ant-design/cli lint apps/admin/src --format json` |
| browser QA  | Playwright evidence (breakpoints + checkpoints)     |

## 4. Baseline

| Item                          | Value                                    |
| ----------------------------- | ---------------------------------------- |
| Baseline commit               | _record commit SHA at wave start_        |
| Baseline lint                 | _PASS/FAIL + date_                       |
| Baseline typecheck            | _PASS/FAIL + date_                       |
| Baseline test (files/tests)   | _e.g. 92 files / 581 tests PASS + date_  |
| Baseline build                | _PASS/FAIL + date_                       |

## 5. Evidence by Wave

Fill one module block per row as it moves. Leave `—` until real evidence exists.

### Wave 00 — protect / reuse (characterization safety net)

| Module / area | Characterization added | Fail-on-removal proven | Gate result | Status | Evidence path |
| ------------- | ---------------------- | ---------------------- | ----------- | ------ | ------------- |
| _module_      | —                      | —                      | —           | mapped | —             |

### Wave 02 — Admin registry skeleton + Dashboard pilot

| Module / area | Manifest/extension wired | Parity vs legacy | Gate result | Status | Evidence path |
| ------------- | ------------------------ | ---------------- | ----------- | ------ | ------------- |
| _dashboard_   | —                        | —                | —           | mapped | —             |

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

| Workflow                                          | Evidence path | Status |
| ------------------------------------------------- | ------------- | ------ |
| Cancel paid order → refund + inventory reversal (atomic, idempotent) | — | mapped |
| Cancel unpaid order → no refund/reversal          | —             | mapped |
| POS session persistence + cash reconciliation     | —             | mapped |
| i18n ID/EN key parity                             | —             | mapped |
| Rupiah formatting stability                       | —             | mapped |

## 7. Cutover Log

Append-only. One line per module reaching `verified` or `retired`.

| Date | Module | Action | Gate summary | Legacy removed? | Rollback note |
| ---- | ------ | ------ | ------------ | --------------- | ------------- |
| —    | —      | —      | —            | —               | —             |
