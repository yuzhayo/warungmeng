import type {
  InventoryPolicy,
  MenuAvailability,
  MenuCategory,
  MenuItem,
  MenuVariantGroup,
  Money,
  SalesInterval,
} from "./types";

export type CatalogValidationCode =
  | "required"
  | "invalid_integer"
  | "invalid_money"
  | "invalid_datetime"
  | "invalid_time"
  | "invalid_range"
  | "duplicate"
  | "overlap"
  | "too_many";

export interface CatalogValidationIssue {
  readonly path: string;
  readonly code: CatalogValidationCode;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MAX_SALES_INTERVALS = 3;

function required(value: string, path: string, issues: CatalogValidationIssue[]): void {
  if (value.trim().length === 0) {
    issues.push({ path, code: "required" });
  }
}

function validateSortOrder(value: number, path: string, issues: CatalogValidationIssue[]): void {
  if (!Number.isInteger(value) || value < 0) {
    issues.push({ path, code: "invalid_integer" });
  }
}

function validateMoney(value: Money, path: string, issues: CatalogValidationIssue[]): void {
  if (!Number.isInteger(value.amount) || value.amount < 0 || value.currency !== "IDR") {
    issues.push({ path, code: "invalid_money" });
  }
}

function validateInventory(
  value: InventoryPolicy,
  path: string,
  issues: CatalogValidationIssue[],
): void {
  if (value.mode === "tracked" && (!Number.isInteger(value.quantity) || value.quantity < 0)) {
    issues.push({ path: `${path}.quantity`, code: "invalid_integer" });
  }
}

function validateAvailability(
  value: MenuAvailability,
  path: string,
  issues: CatalogValidationIssue[],
): void {
  if (
    value.status === "unavailable" &&
    value.unavailableUntil !== null &&
    Number.isNaN(Date.parse(value.unavailableUntil))
  ) {
    issues.push({ path: `${path}.unavailableUntil`, code: "invalid_datetime" });
  }
}

function validateUniqueStrings(
  values: readonly string[],
  path: string,
  issues: CatalogValidationIssue[],
): void {
  const seen = new Set<string>();

  values.forEach((value, index) => {
    required(value, `${path}.${index}`, issues);
    if (seen.has(value)) {
      issues.push({ path: `${path}.${index}`, code: "duplicate" });
    }
    seen.add(value);
  });
}

function toMinutes(value: string): number | null {
  const match = TIME_PATTERN.exec(value);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function validateIntervals(
  intervals: readonly SalesInterval[],
  path: string,
  issues: CatalogValidationIssue[],
): void {
  if (intervals.length === 0) {
    issues.push({ path, code: "required" });
    return;
  }

  if (intervals.length > MAX_SALES_INTERVALS) {
    issues.push({ path, code: "too_many" });
  }

  validateUniqueStrings(
    intervals.map((interval) => interval.id),
    `${path}.id`,
    issues,
  );

  const ranges: Array<{ index: number; start: number; end: number }> = [];
  intervals.forEach((interval, index) => {
    const start = toMinutes(interval.start);
    const end = toMinutes(interval.end);

    if (start === null) {
      issues.push({ path: `${path}.${index}.start`, code: "invalid_time" });
    }
    if (end === null) {
      issues.push({ path: `${path}.${index}.end`, code: "invalid_time" });
    }
    if (start !== null && end !== null) {
      if (start >= end) {
        issues.push({ path: `${path}.${index}`, code: "invalid_range" });
      } else {
        ranges.push({ index, start, end });
      }
    }
  });

  ranges
    .sort((left, right) => left.start - right.start)
    .forEach((range, index, sortedRanges) => {
      const previous = sortedRanges[index - 1];
      if (previous && range.start < previous.end) {
        issues.push({ path: `${path}.${range.index}`, code: "overlap" });
      }
    });
}

export function validateMenuCategory(category: MenuCategory): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  required(category.id, "id", issues);
  required(category.name, "name", issues);
  required(category.slug, "slug", issues);
  validateSortOrder(category.sortOrder, "sortOrder", issues);
  return issues;
}

export function validateMenuItem(menu: MenuItem): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  required(menu.id, "id", issues);
  required(menu.name, "name", issues);
  required(menu.slug, "slug", issues);
  required(menu.categoryId, "categoryId", issues);
  validateMoney(menu.price, "price", issues);

  if (menu.compareAtPrice) {
    validateMoney(menu.compareAtPrice, "compareAtPrice", issues);
    if (menu.compareAtPrice.amount <= menu.price.amount) {
      issues.push({ path: "compareAtPrice.amount", code: "invalid_range" });
    }
  }

  validateAvailability(menu.availability, "availability", issues);
  validateInventory(menu.inventory, "inventory", issues);
  validateUniqueStrings(menu.variantGroupIds, "variantGroupIds", issues);
  validateSortOrder(menu.sortOrder, "sortOrder", issues);

  if (menu.salesSchedule.mode === "scheduled") {
    validateUniqueStrings(menu.salesSchedule.activeDays, "salesSchedule.activeDays", issues);
    if (menu.salesSchedule.activeDays.length === 0) {
      issues.push({ path: "salesSchedule.activeDays", code: "required" });
    }
    if (!menu.salesSchedule.allDay) {
      validateIntervals(menu.salesSchedule.intervals, "salesSchedule.intervals", issues);
    }
  }

  return issues;
}

export function validateMenuVariantGroup(group: MenuVariantGroup): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  required(group.id, "id", issues);
  required(group.name, "name", issues);
  validateSortOrder(group.sortOrder, "sortOrder", issues);

  const { minSelections, maxSelections } = group.selection;
  if (!Number.isInteger(minSelections) || minSelections < 0) {
    issues.push({ path: "selection.minSelections", code: "invalid_integer" });
  }
  if (
    maxSelections !== null &&
    (!Number.isInteger(maxSelections) || maxSelections < 0 || maxSelections < minSelections)
  ) {
    issues.push({ path: "selection.maxSelections", code: "invalid_range" });
  }

  if (group.options.length === 0) {
    issues.push({ path: "options", code: "required" });
  }
  if (maxSelections !== null && maxSelections > group.options.length) {
    issues.push({ path: "selection.maxSelections", code: "invalid_range" });
  }

  validateUniqueStrings(
    group.options.map((option) => option.id),
    "options.id",
    issues,
  );
  group.options.forEach((option, index) => {
    required(option.name, `options.${index}.name`, issues);
    validateMoney(option.priceAdjustment, `options.${index}.priceAdjustment`, issues);
    validateAvailability(option.availability, `options.${index}.availability`, issues);
    validateInventory(option.inventory, `options.${index}.inventory`, issues);
    validateSortOrder(option.sortOrder, `options.${index}.sortOrder`, issues);
  });

  return issues;
}

export function isMenuAvailable(menu: MenuItem, now: Date = new Date()): boolean {
  if (menu.inventory.mode === "tracked" && menu.inventory.quantity === 0) return false;
  if (menu.availability.status === "available") return true;
  if (menu.availability.unavailableUntil === null) return false;

  const unavailableUntil = Date.parse(menu.availability.unavailableUntil);
  return !Number.isNaN(unavailableUntil) && unavailableUntil <= now.getTime();
}
