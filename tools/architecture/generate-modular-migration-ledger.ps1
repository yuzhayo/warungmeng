param(
  [string]$RepositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path,
  [string]$OutputPath = (Join-Path $RepositoryRoot ".docs/MODULAR-MIGRATION-LEDGER.md")
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Get-RelativePath {
  param([string]$Path)

  return [IO.Path]::GetRelativePath($RepositoryRoot, $Path).Replace("\", "/")
}

function Get-MarkdownCode {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return "—"
  }

  return "``$($Value.Replace('|', '&#124;'))``"
}

function Get-Responsibility {
  param([string]$Path)

  if ($Path -match "\.(test|spec)\.(ts|tsx)$") { return "TEST — regression/behavior evidence" }
  if ($Path -match "\.css$") { return "UI — owner-local styling" }
  if ($Path -match "/main\.tsx$") { return "BOOT — application mount" }
  if ($Path -match "/App\.tsx$") { return "COMP — application composition" }
  if ($Path -match "/app/.+Routes?\.tsx$") { return "COMP — centralized route composition" }
  if ($Path -match "/app/navigation\.(ts|tsx)$") { return "COMP — centralized navigation definition" }
  if ($Path -match "/app/.*Provider.*\.tsx$") { return "COMP — application providers" }
  if ($Path -match "/app/") { return "COMP — app runtime/configuration" }
  if ($Path -match "/screens/.*\.tsx$" -or $Path -match "/[^/]+Screen\.tsx$") {
    return "SCREEN — route-level composition"
  }
  if ($Path -match "/views/.*\.tsx$") { return "UI — major feature view composition" }
  if ($Path -match "/components/.*\.tsx$") { return "UI — feature presentation/interaction" }
  if ($Path -match "/hooks/use[A-Z].*\.tsx?$") { return "HOOK — React/presentation bridge" }
  if ($Path -match "/application/use[A-Z].*\.tsx?$") { return "HOOK — React/application bridge" }
  if ($Path -match "/application/.*[Cc]ommands?\.ts$") { return "APP — command/orchestration" }
  if ($Path -match "/application/.*[Rr]epositor(y|ies)\.ts$") { return "APP — repository port/wiring" }
  if ($Path -match "/application/.*(Model|View|Period|Data|Validation|Storage|Store)\.tsx?$") {
    return "APP — model/presenter/state adapter"
  }
  if ($Path -match "/application/") { return "APP — feature coordination/pure model" }
  if ($Path -match "^packages/domain/src/.+/types\.ts$") { return "DOMAIN — public business types" }
  if ($Path -match "^packages/domain/src/") { return "DOMAIN — pure rule/calculation/validation" }
  if ($Path -match "^packages/data/src/repositories/") { return "DATA — repository contract" }
  if ($Path -match "^packages/data/src/mocks/WarungMeng.*Data\.ts$") { return "DATA — mock fixture/factory" }
  if ($Path -match "^packages/data/src/mocks/") { return "DATA — in-memory repository adapter" }
  if ($Path -match "^packages/data/src/") { return "DATA — package public surface" }
  if ($Path -match "^packages/i18n/src/") { return "I18N — locale/format contract" }
  if ($Path -match "^packages/ui-admin/src/") { return "UI — reusable Admin UI/theme" }
  if ($Path -match "^packages/ui-storefront/src/") { return "UI — reusable Storefront public surface" }
  if ($Path -match "^packages/config/src/") { return "CONFIG — shared configuration" }
  if ($Path -match "vite-env\.d\.ts$") { return "CONFIG — Vite environment types" }
  if ($Path -match "^apps/.+\.tsx$") { return "UI — feature presentation/interaction" }

  return "SOURCE — requires owner review"
}

function Get-ProtectedBehavior {
  param(
    [string]$Path,
    [string]$Responsibility
  )

  if ($Responsibility -like "TEST*") { return "Existing regression evidence; assertion quality must be reviewed before reuse" }
  if ($Responsibility -like "UI*") { return "Rendered content, interaction, accessibility, focus, responsive layout, and visual state" }
  if ($Responsibility -like "SCREEN*") { return "Route params, loading/empty/error/not-found states, navigation, and user workflow" }
  if ($Responsibility -like "HOOK*") { return "Async lifecycle, stale-response protection, retry, cleanup, and state identity" }
  if ($Path -match "/app/.+Routes?\.tsx$") { return "Current public routes, nesting, redirects, lazy loading, and not-found behavior" }
  if ($Path -match "/app/navigation\.(ts|tsx)$") { return "Navigation identity, order, labels, grouping, and active-route behavior" }
  if ($Path -match "^apps/storefront/src/features/orders/") {
    return "Recent-order identity, safe refresh receipt, status, totals, and not-found handling"
  }
  if ($Path -match "^apps/storefront/src/features/checkout/") {
    return "Pickup checkout validation, submission lock, order input, cart clear, and recent receipt persistence"
  }
  if ($Path -match "^apps/storefront/src/features/cart/") {
    return "Cart add/edit/remove, persistence, validation, totals, and catalog reconciliation"
  }
  if ($Path -match "^apps/storefront/src/features/catalog/") {
    return "Catalog visibility, availability, category/search, menu detail, variants, notes, quantity, and add-to-cart"
  }
  if ($Path -match "/features/orders/|/domain/src/orders/|OrderRepository") {
    return "Order list/detail, valid transitions, and paid/unpaid cancellation semantics"
  }
  if ($Path -match "/features/pos/|/domain/src/pos/") {
    return "POS session persistence, cart/pricing, checkout, receipt, and cash reconciliation"
  }
  if ($Path -match "/features/inventory/|/domain/src/inventory/|InventoryRepository") {
    return "Units, stock, movements, recipes/HPP, idempotent consumption, and reversal"
  }
  if ($Path -match "/features/finance/|/domain/src/finance/|FinanceRepository") {
    return "Finance validation, ledger direction, refund effects, summaries, and reconciliation"
  }
  if ($Path -match "/features/dashboard/|/domain/src/reporting/") {
    return "Period filtering and consistent Order/POS/Finance/Inventory aggregations"
  }
  if ($Path -match "/features/menu/|/features/catalog/|/domain/src/catalog/|MenuCatalogRepository") {
    return "Catalog CRUD/read, visibility, availability, schedules, variants, search, and menu detail"
  }
  if ($Path -match "^packages/i18n/") { return "ID/EN key parity, locale preference, and Indonesian Rupiah separators" }
  if ($Path -match "^packages/ui-admin/") { return "Admin theme tokens, contrast, persistence, and provider behavior" }
  if ($Path -match "^packages/data/src/mocks/") { return "Repository semantics, deterministic fixtures, immutability, and idempotency" }
  if ($Path -match "^packages/data/src/repositories/") { return "Public repository methods, result unions, filters, and async semantics" }
  if ($Path -match "^packages/domain/") { return "Pure deterministic business contract represented by this module" }
  if ($Responsibility -like "COMP*") { return "Provider order, concrete dependency identity, router, and app startup behavior" }
  if ($Responsibility -like "CONFIG*") { return "Current build/type/runtime configuration contract" }

  return "Current observable behavior and public imports must remain stable"
}

function Get-TargetInfo {
  param([string]$Path)

  $target = $Path
  $action = "Keep"
  $bridge = "None"
  $wave = "00 — protect/reuse"

  switch -Regex ($Path) {
    "^apps/admin/src/app/AppRoutes\.tsx$" {
      $target = "apps/admin/src/app/routing/AdminRoutes.tsx + feature manifests"
      $action = "Split"
      $bridge = "Existing AppRoutes remains active until every Admin route contribution is verified"
      $wave = "03 — Admin declarative routes"
      break
    }
    "^apps/admin/src/app/navigation\.tsx$" {
      $target = "apps/admin/src/app/navigation/resolveAdminNavigation.ts + feature manifests"
      $action = "Split"
      $bridge = "Existing navigation definitions remain source of truth during compatibility registration"
      $wave = "03 — Admin declarative navigation"
      break
    }
    "^apps/admin/src/App\.tsx$" {
      $target = "apps/admin/src/App.tsx + apps/admin/src/app/composition/createAdminRuntime.ts"
      $action = "Split"
      $bridge = "App continues current providers/router while runtime is introduced behind a provider"
      $wave = "02 — Admin registry skeleton"
      break
    }
    "^apps/storefront/src/app/AppRoutes\.tsx$" {
      $target = "apps/storefront/src/app/routing/StorefrontRoutes.tsx + feature manifests"
      $action = "Split"
      $bridge = "Existing AppRoutes remains active until all public URLs pass parity"
      $wave = "05 — Storefront registry"
      break
    }
    "^apps/storefront/src/app/ApplicationProviders\.tsx$" {
      $target = "apps/storefront/src/app/providers/StorefrontApplicationProviders.tsx"
      $action = "Move"
      $bridge = "Compatibility re-export until App and tests use the target provider"
      $wave = "05 — Storefront registry"
      break
    }
    "^apps/storefront/src/App\.tsx$" {
      $target = "apps/storefront/src/App.tsx + apps/storefront/src/app/composition/createStorefrontRuntime.ts"
      $action = "Split"
      $bridge = "App keeps current provider/router behavior while runtime is introduced"
      $wave = "05 — Storefront registry"
      break
    }
    "^apps/storefront/src/features/catalog/application/storefrontCatalogRepository\.ts$" {
      $target = "apps/storefront/src/features/catalog/application/ports/storefrontCatalogPort.ts + apps/storefront/src/app/composition/createStorefrontRepositories.ts"
      $action = "Split"
      $bridge = "Existing exported repository aliases delegate to composition-owned instance"
      $wave = "05 — Storefront catalog"
      break
    }
    "^apps/storefront/src/features/checkout/application/storefrontOrderRepository\.ts$" {
      $target = "apps/storefront/src/features/checkout/application/ports/checkoutOrderPort.ts + apps/storefront/src/app/composition/createStorefrontRepositories.ts"
      $action = "Split"
      $bridge = "Existing singleton export delegates to composition-owned OrderRepository"
      $wave = "05 — Storefront checkout"
      break
    }
    "^apps/storefront/src/features/checkout/application/recentOrderReceiptStorage\.test\.ts$" {
      $target = "apps/storefront/src/features/order-confirmation/application/adapters/browserRecentOrderReceiptAdapter.test.ts"
      $action = "Move"
      $bridge = "Run before the split, update the subject/imports with the browser adapter, then rerun as parity evidence"
      $wave = "05 — Storefront transaction flow"
      break
    }
    "^apps/storefront/src/features/checkout/application/recentOrderReceiptStorage\.ts$" {
      $target = "apps/storefront/src/features/order-confirmation/application/ports/recentOrderReceiptStoragePort.ts + apps/storefront/src/features/order-confirmation/application/adapters/browserRecentOrderReceiptAdapter.ts"
      $action = "Split"
      $bridge = "Existing receipt-storage export delegates to the target port/adapter until Checkout and Order Confirmation use a public capability"
      $wave = "05 — Storefront transaction flow"
      break
    }
    "^apps/storefront/src/features/orders/application/orderConfirmationModel\.test\.ts$" {
      $target = "apps/storefront/src/features/order-confirmation/application/presenters/orderConfirmationPresenter.test.ts"
      $action = "Move"
      $bridge = "Run before the move, update the presenter import, then rerun as parity evidence"
      $wave = "05 — Storefront transaction flow"
      break
    }
    "^apps/storefront/src/features/orders/application/orderConfirmationModel\.ts$" {
      $target = "apps/storefront/src/features/order-confirmation/application/presenters/orderConfirmationPresenter.ts"
      $action = "Move"
      $bridge = "Compatibility re-export from the existing orders path until route and test imports migrate"
      $wave = "05 — Storefront transaction flow"
      break
    }
    "^apps/storefront/src/features/orders/application/useOrderConfirmation\.test\.tsx$" {
      $target = "apps/storefront/src/features/order-confirmation/application/controllers/useOrderConfirmationController.test.tsx"
      $action = "Move"
      $bridge = "Run before the move, update the controller import, then rerun as parity evidence"
      $wave = "05 — Storefront transaction flow"
      break
    }
    "^apps/storefront/src/features/orders/application/useOrderConfirmation\.tsx?$" {
      $target = "apps/storefront/src/features/order-confirmation/application/controllers/useOrderConfirmationController.ts"
      $action = "Move"
      $bridge = "Compatibility re-export from the existing orders path until screen imports migrate"
      $wave = "05 — Storefront transaction flow"
      break
    }
    "^apps/storefront/src/features/orders/(.+)$" {
      $target = $Path.Replace(
        "apps/storefront/src/features/orders/",
        "apps/storefront/src/features/order-confirmation/"
      )
      $action = "Move"
      $bridge = "Compatibility re-export/import bridge keeps the existing orders path active until public route and consumers pass parity"
      $wave = "05 — Storefront transaction flow"
      break
    }
    "^apps/storefront/src/screens/NotFoundScreen\.tsx$" {
      $target = "apps/storefront/src/screens/StorefrontNotFoundScreen.tsx"
      $action = "Move"
      $bridge = "Compatibility re-export until Storefront route composition imports the target name"
      $wave = "05 — Storefront registry"
      break
    }
    "^apps/admin/src/features/pos/application/posSessionStore\.ts$" {
      $target = "apps/admin/src/features/pos/application/adapters/browserPosSessionAdapter.ts"
      $action = "Adapt"
      $bridge = "Preserve current storage keys and serialized session contract"
      $wave = "04 — Admin headless capabilities"
      break
    }
  }

  if ($Path -match "^apps/admin/src/features/dashboard/") { $wave = "02 — Dashboard pilot" }
  elseif ($Path -match "^apps/admin/src/features/(menu|settings)/") { $wave = "03 — Admin declarative modules" }
  elseif ($Path -match "^apps/admin/src/features/(orders|pos|inventory|finance)/") { $wave = "04 — Admin cross-domain modules" }
  elseif ($Path -match "^apps/storefront/src/features/catalog/") { $wave = "05 — Storefront catalog" }
  elseif ($Path -match "^apps/storefront/src/features/(cart|checkout|orders)/") { $wave = "05 — Storefront transaction flow" }
  elseif ($Path -match "ImportBoundary|ModuleDiscovery|RouteContributions|NavigationContributions") {
    $wave = "07 — boundary enforcement"
  }

  if ($Path -match "\.(test|spec)\.(ts|tsx)$") {
    if ($action -eq "Keep") {
      $target = $Path
      $action = "Keep/adapt"
      $bridge = "Run against current implementation, then target runtime during parity window"
    }
    else {
      $bridge = "Run before the move, update imports with the target owner, then rerun as parity evidence"
    }
  }

  return [PSCustomObject]@{
    Target = $target
    Action = $action
    Bridge = $bridge
    Wave = $wave
  }
}

function Resolve-RelativeImport {
  param(
    [string]$ImporterPath,
    [string]$Specifier,
    [hashtable]$FileSet,
    [hashtable]$PackageEntryMap
  )

  if ($PackageEntryMap.ContainsKey($Specifier)) {
    return $PackageEntryMap[$Specifier]
  }

  if (-not $Specifier.StartsWith(".")) {
    return $null
  }

  $importerDirectory = Split-Path -Parent (Join-Path $RepositoryRoot $ImporterPath)
  $base = [IO.Path]::GetFullPath((Join-Path $importerDirectory $Specifier))
  $candidatePaths = @(
    $base,
    "$base.ts",
    "$base.tsx",
    "$base.css",
    (Join-Path $base "index.ts"),
    (Join-Path $base "index.tsx")
  )

  foreach ($candidate in $candidatePaths) {
    $relativeCandidate = Get-RelativePath -Path $candidate
    if ($FileSet.ContainsKey($relativeCandidate)) {
      return $relativeCandidate
    }
  }

  return $null
}

function Get-Evidence {
  param(
    [string]$Path,
    [string[]]$Consumers,
    [hashtable]$FileSet
  )

  if ($Path -match "\.(test|spec)\.(ts|tsx)$") {
    return "Self: ``$Path``"
  }

  $extension = [IO.Path]::GetExtension($Path)
  $withoutExtension = $Path.Substring(0, $Path.Length - $extension.Length)
  $directCandidates = @(
    "$withoutExtension.test$extension",
    "$withoutExtension.test.ts",
    "$withoutExtension.test.tsx"
  )

  foreach ($candidate in $directCandidates) {
    if ($FileSet.ContainsKey($candidate)) {
      return "Direct: ``$candidate``"
    }
  }

  $testConsumers = @($Consumers | Where-Object { $_ -match "\.(test|spec)\.(ts|tsx)$" })
  if ($testConsumers.Count -gt 0) {
    $visible = @($testConsumers | Select-Object -First 2 | ForEach-Object { "``$_``" })
    if ($testConsumers.Count -gt 2) {
      $visible += "+$($testConsumers.Count - 2) test consumer"
    }
    return ($visible -join "<br>")
  }

  if ($Path -match "\.css$") {
    return "Required: owner component test + browser parity before move"
  }

  return "Required: characterization test before move/split"
}

$sourceRootPaths = @(
  "apps/admin/src",
  "apps/storefront/src",
  "packages/config/src",
  "packages/data/src",
  "packages/domain/src",
  "packages/i18n/src",
  "packages/ui-admin/src",
  "packages/ui-storefront/src"
)

$sourceFiles = @(
  foreach ($sourceRootPath in $sourceRootPaths) {
    $absoluteRoot = Join-Path $RepositoryRoot $sourceRootPath
    if (-not (Test-Path -LiteralPath $absoluteRoot)) {
      continue
    }

    Get-ChildItem -LiteralPath $absoluteRoot -Recurse -File |
      Where-Object { $_.Extension -in @(".ts", ".tsx", ".css") } |
      ForEach-Object { Get-RelativePath -Path $_.FullName }
  }
) | Sort-Object -Unique

$fileSet = @{}
$consumerMap = @{}
foreach ($sourceFile in $sourceFiles) {
  $fileSet[$sourceFile] = $true
  $consumerMap[$sourceFile] = [System.Collections.Generic.List[string]]::new()
}

$packageEntryMap = @{
  "@warungmeng/config" = "packages/config/src/index.ts"
  "@warungmeng/data" = "packages/data/src/index.ts"
  "@warungmeng/domain" = "packages/domain/src/index.ts"
  "@warungmeng/i18n" = "packages/i18n/src/index.ts"
  "@warungmeng/ui-admin" = "packages/ui-admin/src/index.ts"
  "@warungmeng/ui-storefront" = "packages/ui-storefront/src/index.ts"
}

$importPattern = [regex]'(?m)\b(?:import|export)\s+(?:type\s+)?(?:[^"'';\r\n]*?\s+from\s+)?["'']([^"'']+)["'']|\bimport\s*\(\s*["'']([^"'']+)["'']\s*\)'

foreach ($sourceFile in $sourceFiles) {
  $absoluteSource = Join-Path $RepositoryRoot $sourceFile
  $content = Get-Content -LiteralPath $absoluteSource -Raw
  foreach ($match in $importPattern.Matches($content)) {
    $specifier = if ($match.Groups[1].Success) { $match.Groups[1].Value } else { $match.Groups[2].Value }
    $resolved = Resolve-RelativeImport `
      -ImporterPath $sourceFile `
      -Specifier $specifier `
      -FileSet $fileSet `
      -PackageEntryMap $packageEntryMap

    if ($null -ne $resolved -and $consumerMap.ContainsKey($resolved)) {
      $consumerMap[$resolved].Add($sourceFile)
    }
  }
}

$headCommit = (& git -C $RepositoryRoot rev-parse --short HEAD).Trim()
$workingTreeLines = @(& git -C $RepositoryRoot status --short)
$workingTreeState = if ($workingTreeLines.Count -eq 0) { "clean" } else { "dirty ($($workingTreeLines.Count) entries; preserved)" }
$auditDate = Get-Date -Format "yyyy-MM-dd"

$rows = foreach ($sourceFile in $sourceFiles) {
  $responsibility = Get-Responsibility -Path $sourceFile
  $targetInfo = Get-TargetInfo -Path $sourceFile
  $consumers = @($consumerMap[$sourceFile] | Sort-Object -Unique)
  $consumerText = if ($consumers.Count -eq 0) {
    "No direct relative/package-entry consumer found"
  } else {
    $visibleConsumers = @($consumers | Select-Object -First 3 | ForEach-Object { "``$_``" })
    if ($consumers.Count -gt 3) {
      $visibleConsumers += "+$($consumers.Count - 3) more"
    }
    $visibleConsumers -join "<br>"
  }

  [PSCustomObject]@{
    Current = $sourceFile
    Responsibility = $responsibility
    Consumers = $consumerText
    Protected = Get-ProtectedBehavior -Path $sourceFile -Responsibility $responsibility
    Target = $targetInfo.Target
    Action = $targetInfo.Action
    Bridge = $targetInfo.Bridge
    Evidence = Get-Evidence -Path $sourceFile -Consumers $consumers -FileSet $fileSet
    Status = "mapped"
    Wave = $targetInfo.Wave
  }
}

$responsibilitySummary = $rows |
  Group-Object Responsibility |
  Sort-Object Name |
  ForEach-Object { "| $($_.Name) | $($_.Count) |" }

$actionSummary = $rows |
  Group-Object Action |
  Sort-Object Name |
  ForEach-Object { "| $($_.Name) | $($_.Count) |" }

$groupDefinitions = @(
  @{ Heading = "Admin application"; Prefix = "apps/admin/src/" },
  @{ Heading = "Storefront application"; Prefix = "apps/storefront/src/" },
  @{ Heading = "Shared config"; Prefix = "packages/config/src/" },
  @{ Heading = "Shared domain"; Prefix = "packages/domain/src/" },
  @{ Heading = "Shared data"; Prefix = "packages/data/src/" },
  @{ Heading = "Shared i18n"; Prefix = "packages/i18n/src/" },
  @{ Heading = "Shared Admin UI"; Prefix = "packages/ui-admin/src/" },
  @{ Heading = "Shared Storefront UI"; Prefix = "packages/ui-storefront/src/" }
)

$builder = [Text.StringBuilder]::new()
[void]$builder.AppendLine("# Warung Meng — Modular Migration Ledger")
[void]$builder.AppendLine()
[void]$builder.AppendLine("Status: Phase 00 inventory generated; mapping requires vertical-slice verification  ")
[void]$builder.AppendLine("Audit date: $auditDate  ")
[void]$builder.AppendLine("Live checkout HEAD: ``$headCommit``  ")
[void]$builder.AppendLine("Latest production-source baseline recorded by context: ``09ad95a``  ")
[void]$builder.AppendLine("Working tree at generation: $workingTreeState  ")
[void]$builder.AppendLine("Generator: ``tools/architecture/generate-modular-migration-ledger.ps1``")
[void]$builder.AppendLine()
[void]$builder.AppendLine("> This ledger inventories every TypeScript, TSX, and CSS source file under the two")
[void]$builder.AppendLine("> applications and existing shared packages. ``mapped`` means an initial owner/target")
[void]$builder.AppendLine("> exists; it does not mean parity is verified or the file is safe to retire.")
[void]$builder.AppendLine()
[void]$builder.AppendLine("## 1. Coverage")
[void]$builder.AppendLine()
[void]$builder.AppendLine("- Source files inventoried: **$($rows.Count)**.")
[void]$builder.AppendLine("- Runtime surfaces: Admin and Storefront, with separate target registries.")
[void]$builder.AppendLine("- Shared packages: config, domain, data, i18n, ui-admin, ui-storefront.")
[void]$builder.AppendLine("- Excluded: generated build output, dependencies, Git internals, docs, dev tooling,")
[void]$builder.AppendLine("  and non-source assets. These are not migration owners for UI/business logic.")
[void]$builder.AppendLine("- Consumer graph: static relative imports plus ``@warungmeng/*`` package-entry imports.")
[void]$builder.AppendLine("- Dynamic runtime use, string IDs, CSS selectors, and router behavior still require")
[void]$builder.AppendLine("  characterization/parity evidence.")
[void]$builder.AppendLine()
[void]$builder.AppendLine("### Responsibility summary")
[void]$builder.AppendLine()
[void]$builder.AppendLine("| Responsibility | Files |")
[void]$builder.AppendLine("| --- | ---: |")
foreach ($summaryLine in $responsibilitySummary) { [void]$builder.AppendLine($summaryLine) }
[void]$builder.AppendLine()
[void]$builder.AppendLine("### Migration-action summary")
[void]$builder.AppendLine()
[void]$builder.AppendLine("| Initial action | Files |")
[void]$builder.AppendLine("| --- | ---: |")
foreach ($summaryLine in $actionSummary) { [void]$builder.AppendLine($summaryLine) }
[void]$builder.AppendLine()
[void]$builder.AppendLine("## 2. Status Contract")
[void]$builder.AppendLine()
[void]$builder.AppendLine("| Status | Meaning |")
[void]$builder.AppendLine("| --- | --- |")
[void]$builder.AppendLine("| ``unmapped`` | Current owner/behavior has not been classified |")
[void]$builder.AppendLine("| ``mapped`` | Initial responsibility, consumers, target, action, and evidence need are recorded |")
[void]$builder.AppendLine("| ``scaffolded`` | Target manifest/extension/port path exists but current path remains active |")
[void]$builder.AppendLine("| ``wired`` | Target runtime uses the current or migrated implementation through an explicit bridge |")
[void]$builder.AppendLine("| ``verified`` | Automated parity and required browser evidence pass for the vertical slice |")
[void]$builder.AppendLine("| ``retired`` | All consumers migrated; legacy path and temporary bridge removed |")
[void]$builder.AppendLine()
[void]$builder.AppendLine("No row may jump from ``mapped`` to ``retired``. Source deletion requires ``verified``")
[void]$builder.AppendLine("evidence and a fresh consumer-graph check.")
[void]$builder.AppendLine()
[void]$builder.AppendLine("## 3. Protected Cross-Domain Workflows")
[void]$builder.AppendLine()
[void]$builder.AppendLine("| Workflow | Current owners to verify | Target capability boundary | Required parity |")
[void]$builder.AppendLine("| --- | --- | --- | --- |")
[void]$builder.AppendLine("| Paid order cancellation | Admin Orders command + Order/Inventory/Finance repositories | ``orders.manage`` coordinating ``inventory.reverse`` and ``finance.refund`` | Atomic and idempotent refund/reversal exactly once |")
[void]$builder.AppendLine("| Unpaid cancellation | Admin Orders command + Order repository | ``orders.manage`` | Cancel without refund or inventory reversal |")
[void]$builder.AppendLine("| POS checkout | POS model/hooks + Order/Inventory repositories | ``pos.checkout`` with order/inventory ports | Deterministic totals, order creation, stock consumption, retry path |")
[void]$builder.AppendLine("| POS session close | POS session store/model | ``pos.session`` + storage port | Persistent open session and expected/actual/variance reconciliation |")
[void]$builder.AppendLine("| Storefront checkout | Cart/catalog snapshot + Checkout + Order repository | ``checkout.submit`` | Submission lock, pickup order input, cart clear, recent receipt |")
[void]$builder.AppendLine("| Reporting | Dashboard application + reporting domain | ``reporting.read`` | Same period produces consistent cards/tables/reports |")
[void]$builder.AppendLine()
[void]$builder.AppendLine("## 4. Route and Navigation Cutover")
[void]$builder.AppendLine()
[void]$builder.AppendLine("| Surface | Current source | Protected contract | Target | Status |")
[void]$builder.AppendLine("| --- | --- | --- | --- | --- |")
[void]$builder.AppendLine("| Admin | ``apps/admin/src/app/AppRoutes.tsx`` | Existing nested routes, redirects, detail IDs | Feature route contributions + ``AdminRoutes`` resolver | mapped |")
[void]$builder.AppendLine("| Admin | ``apps/admin/src/app/navigation.tsx`` | Top-level order, label keys, icons, HPP nested under Inventory | Feature navigation contributions + resolver | mapped |")
[void]$builder.AppendLine("| Storefront | ``apps/storefront/src/app/AppRoutes.tsx`` | ``/``, ``/menu/:menuSlug``, ``/cart``, ``/checkout``, ``/orders/:orderId``, not found | Feature route contributions + ``StorefrontRoutes`` resolver | mapped |")
[void]$builder.AppendLine()
[void]$builder.AppendLine("## 5. Source Inventory")
[void]$builder.AppendLine()
[void]$builder.AppendLine("Fields: current owner; responsibility; direct static consumers; protected behavior;")
[void]$builder.AppendLine("target owner; migration action; compatibility bridge; evidence; status; wave.")
[void]$builder.AppendLine()

foreach ($groupDefinition in $groupDefinitions) {
  $groupRows = @($rows | Where-Object { $_.Current.StartsWith($groupDefinition.Prefix) })
  [void]$builder.AppendLine("### $($groupDefinition.Heading) ($($groupRows.Count))")
  [void]$builder.AppendLine()
  [void]$builder.AppendLine("| Current path | Responsibility | Current consumers | Protected behavior | Target path | Action | Compatibility path | Test evidence | Status | Wave |")
  [void]$builder.AppendLine("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |")

  foreach ($row in $groupRows) {
    $current = Get-MarkdownCode -Value $row.Current
    $target = Get-MarkdownCode -Value $row.Target
    $responsibility = $row.Responsibility.Replace("|", "&#124;")
    $consumers = $row.Consumers.Replace("|", "&#124;")
    $protected = $row.Protected.Replace("|", "&#124;")
    $action = $row.Action.Replace("|", "&#124;")
    $bridge = $row.Bridge.Replace("|", "&#124;")
    $evidence = $row.Evidence.Replace("|", "&#124;")
    $status = "``$($row.Status)``"
    $wave = $row.Wave.Replace("|", "&#124;")

    [void]$builder.AppendLine("| $current | $responsibility | $consumers | $protected | $target | $action | $bridge | $evidence | $status | $wave |")
  }

  [void]$builder.AppendLine()
}

[void]$builder.AppendLine("## 6. Verification Checklist per Vertical Module")
[void]$builder.AppendLine()
[void]$builder.AppendLine("1. Re-run this generator and review consumer changes.")
[void]$builder.AppendLine("2. Confirm every module file has the intended target and action.")
[void]$builder.AppendLine("3. Add missing characterization tests before move/split.")
[void]$builder.AppendLine("4. Register compatibility extension without duplicating active implementation.")
[void]$builder.AppendLine("5. Wire manifest → extension → capability → current implementation → current UI.")
[void]$builder.AppendLine("6. Run target tests, workspace typecheck/build, then full gate when contracts change.")
[void]$builder.AppendLine("7. Run browser parity for material UI/routes.")
[void]$builder.AppendLine("8. Mark rows ``wired`` then ``verified`` with evidence path.")
[void]$builder.AppendLine("9. Remove legacy path only after no consumer remains.")
[void]$builder.AppendLine("10. Re-run generator after cutover and record remediation/rollback result.")
[void]$builder.AppendLine()
[void]$builder.AppendLine("## 7. Known Static-Analysis Limits")
[void]$builder.AppendLine()
[void]$builder.AppendLine("- Consumer discovery does not prove runtime reachability.")
[void]$builder.AppendLine("- React Router paths, translation keys, storage keys, and action IDs can be string-linked.")
[void]$builder.AppendLine("- CSS selectors and AntD semantic slots require component/browser inspection.")
[void]$builder.AppendLine("- A file with no direct importer may be an entry point, lazy module, test setup, or dead code;")
[void]$builder.AppendLine("  it is not automatically safe to delete.")
[void]$builder.AppendLine("- ``mapped`` rows are planning evidence, not current validation PASS.")

$outputDirectory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

[IO.File]::WriteAllText($OutputPath, $builder.ToString(), [Text.UTF8Encoding]::new($false))
Write-Output "Generated $($rows.Count) rows at $OutputPath"
