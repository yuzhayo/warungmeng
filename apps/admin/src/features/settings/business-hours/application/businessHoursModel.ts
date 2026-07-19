import type { Weekday } from "@warungmeng/domain";

export const BH_WEEKDAYS: readonly Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const BH_DEFAULT_RANGE = { start: "09:00", end: "17:00" };

export interface TimeRange {
  readonly id: string;
  readonly start: string;
  readonly end: string;
}

export interface DaySchedule {
  readonly weekday: Weekday;
  readonly open: boolean;
  readonly ranges: readonly TimeRange[];
}

export interface SpecialSchedule {
  readonly id: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly startDate: string;
  readonly endDate: string;
  readonly days: readonly DaySchedule[];
}

export interface OutletSchedule {
  readonly id: string;
  readonly name: string;
  readonly regular: readonly DaySchedule[];
  readonly specials: readonly SpecialSchedule[];
}

export interface ValidationError {
  readonly path: string;
  readonly code: string;
}

/* — Time format validation — */

const HHMM_RE = /^\d{2}:\d{2}$/;

export function isValidTimeFormat(value: string): boolean {
  if (!HHMM_RE.test(value)) return false;
  const hh = Number(value.slice(0, 2));
  const mm = Number(value.slice(3, 5));
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export function isAllowedEndTime(value: string): boolean {
  return value === "24:00" || isValidTimeFormat(value);
}

export function timeToMinutes(value: string): number {
  if (value === "24:00") return 1440;
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

/* — Range validation — */

export function validateRanges(ranges: readonly TimeRange[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const r of ranges) {
    if (!isValidTimeFormat(r.start)) {
      errors.push({ path: `range.${r.id}.start`, code: "timeFormat" });
    }
    if (!isAllowedEndTime(r.end)) {
      errors.push({ path: `range.${r.id}.end`, code: "endTime2400" });
    }
    if (
      isValidTimeFormat(r.start) &&
      isAllowedEndTime(r.end) &&
      timeToMinutes(r.start) >= timeToMinutes(r.end)
    ) {
      errors.push({ path: `range.${r.id}.order`, code: "startBeforeEnd" });
    }
  }

  // Duplicate check
  const validRanges = ranges.filter(
    (r) =>
      isValidTimeFormat(r.start) &&
      isAllowedEndTime(r.end) &&
      timeToMinutes(r.start) < timeToMinutes(r.end),
  );
  for (let i = 0; i < validRanges.length; i++) {
    for (let j = i + 1; j < validRanges.length; j++) {
      const a = validRanges[i]!;
      const b = validRanges[j]!;
      if (a.start === b.start && a.end === b.end) {
        errors.push({ path: `range.${a.id}.duplicate`, code: "duplicate" });
      }
    }
  }

  // Overlap check
  const sorted = [...validRanges].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!;
    const b = sorted[i + 1]!;
    if (timeToMinutes(a.end) > timeToMinutes(b.start)) {
      errors.push({ path: `range.${a.id}.overlap`, code: "overlap" });
    }
  }

  return errors;
}

export function validateDaySchedule(day: DaySchedule): ValidationError[] {
  const errors: ValidationError[] = [];
  if (day.open && day.ranges.length === 0) {
    errors.push({ path: `day.${day.weekday}`, code: "openWithoutRange" });
  }
  return [...errors, ...validateRanges(day.ranges)];
}

export function validateRegularSchedule(regular: readonly DaySchedule[]): ValidationError[] {
  return regular.flatMap(validateDaySchedule);
}

export function validateSpecialSchedule(
  special: SpecialSchedule,
  allSpecials: readonly SpecialSchedule[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!special.name.trim()) {
    errors.push({ path: "special.name", code: "name" });
  }
  if (!special.startDate) {
    errors.push({ path: "special.startDate", code: "startDate" });
  }
  if (!special.endDate) {
    errors.push({ path: "special.endDate", code: "endDate" });
  }
  if (special.startDate && special.endDate && special.startDate > special.endDate) {
    errors.push({ path: "special.startDate", code: "startAfterEnd" });
  }

  // Overlap check among enabled specials
  if (special.enabled && special.startDate && special.endDate) {
    for (const other of allSpecials) {
      if (other.id === special.id) continue;
      if (!other.enabled) continue;
      if (!other.startDate || !other.endDate) continue;
      if (special.startDate <= other.endDate && special.endDate >= other.startDate) {
        errors.push({ path: "special.startDate", code: "overlap" });
        break;
      }
    }
  }

  return [...errors, ...special.days.flatMap(validateDaySchedule)];
}

export function validateAllSpecials(specials: readonly SpecialSchedule[]): ValidationError[] {
  if (specials.length > 5) {
    return [{ path: "specials", code: "maxSchedules" }];
  }
  return specials.flatMap((s) => validateSpecialSchedule(s, specials));
}

/* — Override logic — */

export function effectiveScheduleForDate(
  regular: readonly DaySchedule[],
  specials: readonly SpecialSchedule[],
  date: string,
  weekday: Weekday,
): DaySchedule {
  for (const s of specials) {
    if (s.enabled && s.startDate && s.endDate && date >= s.startDate && date <= s.endDate) {
      const day = s.days.find((d) => d.weekday === weekday);
      return day ?? { weekday, open: false, ranges: [] };
    }
  }
  return regular.find((d) => d.weekday === weekday) ?? { weekday, open: false, ranges: [] };
}

/* — Sorting — */

export function sortRangesByStart(ranges: readonly TimeRange[]): TimeRange[] {
  return [...ranges].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

/* — Summary helpers — */

export function formatRangeSummary(ranges: readonly TimeRange[]): string {
  const sorted = sortRangesByStart(ranges);
  return sorted.map((r) => `${r.start}–${r.end}`).join(", ");
}

export function daySummary(day: DaySchedule): string {
  if (!day.open) return "";
  return formatRangeSummary(day.ranges);
}

/* — Draft helpers — */

export function cloneOutletSchedule(schedule: OutletSchedule): OutletSchedule {
  return {
    ...schedule,
    regular: schedule.regular.map((d) => ({
      ...d,
      ranges: d.ranges.map((r) => ({ ...r })),
    })),
    specials: schedule.specials.map((s) => ({
      ...s,
      days: s.days.map((d) => ({
        ...d,
        ranges: d.ranges.map((r) => ({ ...r })),
      })),
    })),
  };
}

export function outletsEqual(a: OutletSchedule, b: OutletSchedule): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/* — Stable ID counter — */

let nextId = 1;
export function generateStableId(): string {
  return `bh-${nextId++}`;
}

export function resetStableIdCounter(): void {
  nextId = 1;
}

/* — Range add/remove — */

export function addRangeToDay(day: DaySchedule, id: string): DaySchedule {
  return { ...day, ranges: [...day.ranges, { id, ...BH_DEFAULT_RANGE }] };
}

export function removeRangeFromDay(day: DaySchedule, rangeId: string): DaySchedule {
  return { ...day, ranges: day.ranges.filter((r) => r.id !== rangeId) };
}

/* — Close/reopen — */

export function closeDay(day: DaySchedule): DaySchedule {
  return { ...day, open: false };
}

export function reopenDay(day: DaySchedule, fallbackRanges: readonly TimeRange[]): DaySchedule {
  const ranges = day.ranges.length > 0 ? day.ranges : fallbackRanges;
  return { ...day, open: true, ranges };
}

/* — Date format helper — */

export function formatDateInput(value: string): string {
  return value; // ponytail: add dayjs parsing when backend arrives
}

/* — Touched field tracking — */

export interface TouchedFields {
  readonly rangeFields: ReadonlyMap<string, ReadonlySet<string>>;
  readonly days: ReadonlySet<string>;
}

export function emptyTouched(): TouchedFields {
  return { rangeFields: new Map(), days: new Set() };
}

export function touchRangeField(
  touched: TouchedFields,
  rangeId: string,
  field: string,
): TouchedFields {
  const existing = touched.rangeFields.get(rangeId) ?? new Set();
  const updated = new Set(existing);
  updated.add(field);
  const map = new Map(touched.rangeFields);
  map.set(rangeId, updated);
  return { ...touched, rangeFields: map };
}

export function touchDay(touched: TouchedFields, weekday: string): TouchedFields {
  const set = new Set(touched.days);
  set.add(weekday);
  return { ...touched, days: set };
}

export function isRangeFieldTouched(
  touched: TouchedFields,
  rangeId: string,
  field: string,
): boolean {
  return touched.rangeFields.get(rangeId)?.has(field) === true;
}

export function isDayTouched(touched: TouchedFields, weekday: string): boolean {
  return touched.days.has(weekday);
}

export function shouldShowRangeErrors(
  touched: TouchedFields,
  saveAttempted: boolean,
  rangeId: string,
  field: string,
): boolean {
  return saveAttempted || isRangeFieldTouched(touched, rangeId, field);
}

export function shouldShowDayErrors(
  touched: TouchedFields,
  saveAttempted: boolean,
  weekday: string,
): boolean {
  return saveAttempted || isDayTouched(touched, weekday);
}

/* — Save-time sort helper — */

export function applySaveSorts(outlet: OutletSchedule): OutletSchedule {
  return {
    ...outlet,
    regular: outlet.regular.map((d) =>
      d.open ? { ...d, ranges: sortRangesByStart(d.ranges) } : d,
    ),
    specials: outlet.specials.map((s) => ({
      ...s,
      days: s.days.map((d) => (d.open ? { ...d, ranges: sortRangesByStart(d.ranges) } : d)),
    })),
  };
}
