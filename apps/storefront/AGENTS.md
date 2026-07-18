# Warung Meng Storefront Rules

## Scope

These rules apply to all work under `apps/storefront/`.

The storefront is the customer-facing application. Keep it independent from the
admin dashboard in `apps/admin/`.

## Current Focus

- Build the storefront UI, UX, screens, layout, navigation, and responsive behavior.
- Wiring existing data and domain contracts is allowed.
- Do not redesign or change existing business logic while implementing storefront UI.
- Use mock data or a storefront-local adapter when an integration is not ready.
- Record missing integration behavior as technical debt instead of changing shared logic implicitly.

## Boundaries

- Do not import files from `apps/admin/`.
- Do not import `@warungmeng/ui-admin`.
- Do not edit `apps/admin/` as part of storefront work.
- Do not change validators, domain rules, repository contracts, or persistence behavior
  in shared packages unless the user explicitly approves it.
- Do not modify root configuration, dependencies, or workspace scripts unless required
  by the task and explicitly approved.
- Do not add a new dependency when the existing stack or a local component is sufficient.

## Shared Packages

- Read types and existing business rules from `@warungmeng/domain`.
- Consume existing repositories or mock data from `@warungmeng/data`.
- Use `@warungmeng/i18n` for user-facing translations when its contract supports the screen.
- Put genuinely reusable customer-facing UI in `@warungmeng/ui-storefront`.
- Keep screen-specific presentation inside `apps/storefront/src/`.
- If a shared package must change, keep the change backward-compatible and validate both
  admin and storefront.

## Architecture

- Separate presentation from data wiring.
- Screens own page composition and routing concerns.
- Components own reusable or screen-specific UI sections.
- Hooks or adapters own storefront-local wiring and view state.
- Pure transformations belong in standalone non-React modules and should be tested.
- Avoid placing business rules directly inside JSX event handlers.
- Prefer small focused files with clear ownership over monolithic screen components.

## UI and Accessibility

- Design mobile-first and verify desktop behavior.
- Use semantic HTML and accessible names for interactive controls.
- Support keyboard navigation, visible focus, loading, empty, and error states.
- Keep customer-facing language natural; do not expose developer terminology.
- Preserve Indonesian and English language support from the beginning.
- Format display values consistently; do not silently change Warung Meng's Rupiah format
  when switching UI language.

## Verification

For storefront-only changes, run:

```bash
npm run typecheck --workspace @warungmeng/storefront
npm run build --workspace @warungmeng/storefront
npm run lint
```

Run relevant tests when they exist. Use Playwright browser QA for material UI or responsive
changes when available.

If a shared package is changed, also run:

```bash
npm run typecheck
npm run test
npm run build
```

Do not claim visual parity or responsive correctness without browser verification.
