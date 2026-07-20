import {
  DEFAULT_REPORTING_TIME_ZONE,
  validateReportingPeriod,
  type ReportingPeriod,
} from "@warungmeng/domain";

export const DASHBOARD_PERIOD_VALUES = [
  "today",
  "last-7-days",
  "last-30-days",
  "this-month",
  "custom",
] as const;

export type DashboardPeriodPreset = (typeof DASHBOARD_PERIOD_VALUES)[number];
export type DashboardPresetPeriod = Exclude<DashboardPeriodPreset, "custom">;
export type DashboardClock = () => Date;

export interface DashboardPeriodSelection {
  readonly preset: DashboardPeriodPreset;
  readonly period: ReportingPeriod;
}

const DEFAULT_PRESET: DashboardPresetPeriod = "today";

function systemClock(): Date {
  return new Date();
}

function getDateKey(date: Date, timeZone: string): string {
  if (!Number.isFinite(date.getTime()))
    throw new RangeError("Dashboard clock returned invalid date");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new RangeError("Unable to resolve dashboard date");
  return `${year}-${month}-${day}`;
}

function shiftDateKey(dateKey: string, dayDelta: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + dayDelta);
  return date.toISOString().slice(0, 10);
}

function isPreset(value: string | null): value is DashboardPeriodPreset {
  return DASHBOARD_PERIOD_VALUES.some((preset) => preset === value);
}

function isValidReportingPeriod(period: ReportingPeriod): boolean {
  try {
    validateReportingPeriod(period);
    return true;
  } catch {
    return false;
  }
}

/** Resolves a named dashboard range using the injected clock and reporting timezone. */
export function createDashboardPresetPeriod(
  preset: DashboardPresetPeriod = DEFAULT_PRESET,
  clock: DashboardClock = systemClock,
  timeZone = DEFAULT_REPORTING_TIME_ZONE,
): DashboardPeriodSelection {
  const today = getDateKey(clock(), timeZone);
  const startDate =
    preset === "last-7-days"
      ? shiftDateKey(today, -6)
      : preset === "last-30-days"
        ? shiftDateKey(today, -29)
        : preset === "this-month"
          ? `${today.slice(0, 7)}-01`
          : today;

  return { preset, period: { startDate, endDate: today, timeZone } };
}

/** Creates a validated custom range. Invalid dates or reversed ranges throw a RangeError. */
export function createCustomDashboardPeriod(
  startDate: string,
  endDate: string,
  timeZone = DEFAULT_REPORTING_TIME_ZONE,
): DashboardPeriodSelection {
  const period = { startDate, endDate, timeZone };
  validateReportingPeriod(period);
  return { preset: "custom", period };
}

/**
 * Parses the dashboard period from the URL. Invalid or incomplete values deliberately fall back
 * to today's range so a malformed link cannot leave the report without a usable period.
 */
export function parseDashboardPeriodSearchParams(
  searchParams: URLSearchParams,
  clock: DashboardClock = systemClock,
  timeZone = DEFAULT_REPORTING_TIME_ZONE,
): DashboardPeriodSelection {
  const requestedPreset = searchParams.get("period");
  const preset = isPreset(requestedPreset) ? requestedPreset : DEFAULT_PRESET;
  if (preset !== "custom") return createDashboardPresetPeriod(preset, clock, timeZone);

  const period = {
    startDate: searchParams.get("from") ?? "",
    endDate: searchParams.get("to") ?? "",
    timeZone,
  };
  return isValidReportingPeriod(period)
    ? { preset, period }
    : createDashboardPresetPeriod(DEFAULT_PRESET, clock, timeZone);
}

/** Serializes a validated selection while preserving unrelated dashboard query parameters. */
export function updateDashboardPeriodSearchParams(
  current: URLSearchParams,
  selection: DashboardPeriodSelection,
): URLSearchParams {
  validateReportingPeriod(selection.period);
  const next = new URLSearchParams(current);
  next.set("period", selection.preset);
  if (selection.preset === "custom") {
    next.set("from", selection.period.startDate);
    next.set("to", selection.period.endDate);
  } else {
    next.delete("from");
    next.delete("to");
  }
  return next;
}
