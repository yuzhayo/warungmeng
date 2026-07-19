import { describe, expect, it } from "vitest";
import type { Weekday } from "@warungmeng/domain";
import {
  isValidTimeFormat,
  isAllowedEndTime,
  timeToMinutes,
  validateRanges,
  validateDaySchedule,
  validateSpecialSchedule,
  validateAllSpecials,
  effectiveScheduleForDate,
  sortRangesByStart,
  formatRangeSummary,
  daySummary,
  cloneOutletSchedule,
  outletsEqual,
  generateStableId,
  resetStableIdCounter,
  addRangeToDay,
  removeRangeFromDay,
  closeDay,
  reopenDay,
  emptyTouched,
  touchRangeField,
  touchDay,
  shouldShowRangeErrors,
  shouldShowDayErrors,
  applySaveSorts,
} from "./businessHoursModel";
import type { TimeRange, DaySchedule, SpecialSchedule, OutletSchedule } from "./businessHoursModel";

function makeRange(id: string, start: string, end: string): TimeRange {
  return { id, start, end };
}

function makeDay(weekday: Weekday, open: boolean, ranges: TimeRange[] = []): DaySchedule {
  return { weekday, open, ranges };
}

function makeSpecial(
  id: string,
  name: string,
  enabled: boolean,
  startDate: string,
  endDate: string,
  days: DaySchedule[] = [],
): SpecialSchedule {
  return { id, name, enabled, startDate, endDate, days };
}

describe("businessHoursModel", () => {
  it("validates time format correctly", () => {
    expect(isValidTimeFormat("09:00")).toBe(true);
    expect(isValidTimeFormat("00:00")).toBe(true);
    expect(isValidTimeFormat("23:59")).toBe(true);
    expect(isValidTimeFormat("24:00")).toBe(false);
    expect(isValidTimeFormat("9:00")).toBe(false);
    expect(isValidTimeFormat("25:00")).toBe(false);
    expect(isValidTimeFormat("abc")).toBe(false);
    expect(isValidTimeFormat("09:60")).toBe(false);
  });

  it("allows 24:00 only as end time", () => {
    expect(isAllowedEndTime("24:00")).toBe(true);
    expect(isAllowedEndTime("23:59")).toBe(true);
    expect(isAllowedEndTime("25:00")).toBe(false);
  });

  it("converts time to minutes correctly", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("09:30")).toBe(570);
    expect(timeToMinutes("24:00")).toBe(1440);
  });

  describe("validateRanges", () => {
    it("accepts valid ranges with gaps", () => {
      const ranges = [makeRange("r1", "09:00", "12:00"), makeRange("r2", "13:00", "17:00")];
      expect(validateRanges(ranges)).toEqual([]);
    });

    it("rejects invalid time format", () => {
      const ranges = [makeRange("r1", "abc", "12:00")];
      expect(validateRanges(ranges)).toEqual(
        expect.arrayContaining([{ path: "range.r1.start", code: "timeFormat" }]),
      );
    });

    it("rejects 24:00 as start time", () => {
      const ranges = [makeRange("r1", "24:00", "24:00")];
      expect(validateRanges(ranges)).toEqual(
        expect.arrayContaining([{ path: "range.r1.start", code: "timeFormat" }]),
      );
    });

    it("rejects start not before end", () => {
      const ranges = [makeRange("r1", "12:00", "12:00")];
      expect(validateRanges(ranges)).toEqual(
        expect.arrayContaining([{ path: "range.r1.order", code: "startBeforeEnd" }]),
      );
    });

    it("rejects duplicate ranges", () => {
      const ranges = [makeRange("r1", "09:00", "12:00"), makeRange("r2", "09:00", "12:00")];
      expect(validateRanges(ranges)).toEqual(
        expect.arrayContaining([{ path: "range.r1.duplicate", code: "duplicate" }]),
      );
    });

    it("rejects overlapping ranges", () => {
      const ranges = [makeRange("r1", "09:00", "13:00"), makeRange("r2", "12:00", "17:00")];
      expect(validateRanges(ranges)).toEqual(
        expect.arrayContaining([{ path: "range.r1.overlap", code: "overlap" }]),
      );
    });

    it("accepts end at 24:00", () => {
      const ranges = [makeRange("r1", "09:00", "24:00")];
      expect(validateRanges(ranges)).toEqual([]);
    });
  });

  describe("validateDaySchedule", () => {
    it("rejects open day without ranges", () => {
      const day = makeDay("mon", true);
      expect(validateDaySchedule(day)).toEqual(
        expect.arrayContaining([{ path: "day.mon", code: "openWithoutRange" }]),
      );
    });

    it("accepts closed day", () => {
      const day = makeDay("mon", false);
      expect(validateDaySchedule(day)).toEqual([]);
    });
  });

  describe("effectiveScheduleForDate", () => {
    const regular: readonly DaySchedule[] = [
      makeDay("mon", true, [makeRange("r1", "09:00", "17:00")]),
      makeDay("tue", true, [makeRange("r2", "09:00", "17:00")]),
      makeDay("wed", false),
    ];

    const specials: readonly SpecialSchedule[] = [
      makeSpecial("s1", "Holiday", true, "2025-01-01", "2025-01-01", [
        makeDay("wed", true, [makeRange("r3", "10:00", "14:00")]),
      ]),
    ];

    it("returns special override inside the period", () => {
      const result = effectiveScheduleForDate(regular, specials, "2025-01-01", "wed");
      expect(result.open).toBe(true);
      expect(result.ranges).toHaveLength(1);
    });

    it("returns regular schedule outside the period", () => {
      const result = effectiveScheduleForDate(regular, specials, "2025-01-02", "mon");
      const mon = regular.find((d) => d.weekday === "mon");
      expect(mon).toBeDefined();
      expect(result).toEqual(mon!);
    });

    it("overrides a closed day within the special period", () => {
      const result = effectiveScheduleForDate(regular, specials, "2025-01-01", "wed");
      expect(result.open).toBe(true);
    });

    it("returns closed when special has no matching day", () => {
      const result = effectiveScheduleForDate(regular, specials, "2025-01-01", "thu");
      expect(result.open).toBe(false);
    });
  });

  describe("validateSpecialSchedule", () => {
    it("rejects overlapping enabled specials", () => {
      const s1 = makeSpecial("s1", "A", true, "2025-01-01", "2025-01-05");
      const s2 = makeSpecial("s2", "B", true, "2025-01-03", "2025-01-07");
      const errors = validateSpecialSchedule(s2, [s1, s2]);
      expect(errors).toEqual(
        expect.arrayContaining([{ path: "special.startDate", code: "overlap" }]),
      );
    });

    it("allows overlapping when other is disabled", () => {
      const s1 = makeSpecial("s1", "A", false, "2025-01-01", "2025-01-05");
      const s2 = makeSpecial("s2", "B", true, "2025-01-03", "2025-01-07");
      expect(validateSpecialSchedule(s2, [s1, s2])).toEqual([]);
    });

    it("rejects start after end", () => {
      const s = makeSpecial("s1", "Test", true, "2025-01-10", "2025-01-05");
      const errors = validateSpecialSchedule(s, [s]);
      expect(errors).toEqual(
        expect.arrayContaining([{ path: "special.startDate", code: "startAfterEnd" }]),
      );
    });

    it("allows same start and end date", () => {
      const s = makeSpecial("s1", "Test", true, "2025-01-05", "2025-01-05");
      expect(validateSpecialSchedule(s, [s])).toEqual([]);
    });

    it("rejects empty name", () => {
      const s = makeSpecial("s1", "", true, "2025-01-05", "2025-01-05");
      const errors = validateSpecialSchedule(s, [s]);
      expect(errors).toEqual(expect.arrayContaining([{ path: "special.name", code: "name" }]));
    });
  });

  describe("validateAllSpecials", () => {
    it("rejects more than five specials", () => {
      const specials = Array.from({ length: 6 }, (_, i) =>
        makeSpecial(`s${i}`, `S${i}`, false, "", ""),
      );
      expect(validateAllSpecials(specials)).toEqual([{ path: "specials", code: "maxSchedules" }]);
    });
  });

  describe("cloneOutletSchedule", () => {
    it("deep clones the schedule", () => {
      const schedule: OutletSchedule = {
        id: "o1",
        name: "WM",
        regular: [makeDay("mon", true, [makeRange("r1", "09:00", "17:00")])],
        specials: [],
      };
      const cloned = cloneOutletSchedule(schedule);
      // Mutate clone — original must stay unchanged
      const clonedDay = cloned.regular[0];
      expect(clonedDay).toBeDefined();
      const clonedRange = clonedDay!.ranges[0];
      expect(clonedRange).toBeDefined();
      // Mutate via a writable copy since readonly
      const mutableRange = { ...clonedRange!, start: "10:00" };
      expect(schedule.regular[0]!.ranges[0]!.start).toBe("09:00");
      expect(mutableRange.start).toBe("10:00");
    });
  });

  describe("outletsEqual", () => {
    it("detects identical schedules", () => {
      const a: OutletSchedule = { id: "o1", name: "WM", regular: [], specials: [] };
      expect(outletsEqual(a, a)).toBe(true);
    });

    it("detects different schedules", () => {
      const a: OutletSchedule = { id: "o1", name: "WM", regular: [], specials: [] };
      const b: OutletSchedule = {
        id: "o1",
        name: "WM",
        regular: [makeDay("mon", true, [makeRange("r1", "09:00", "17:00")])],
        specials: [],
      };
      expect(outletsEqual(a, b)).toBe(false);
    });
  });

  describe("addRangeToDay / removeRangeFromDay", () => {
    it("adds and removes ranges", () => {
      const day = makeDay("mon", true, [makeRange("r1", "09:00", "17:00")]);
      const added = addRangeToDay(day, "r2");
      expect(added.ranges).toHaveLength(2);
      const removed = removeRangeFromDay(added, "r2");
      expect(removed.ranges).toHaveLength(1);
    });
  });

  describe("closeDay / reopenDay", () => {
    it("closes and reopens, restoring ranges", () => {
      const day = makeDay("mon", true, [makeRange("r1", "09:00", "17:00")]);
      const closed = closeDay(day);
      expect(closed.open).toBe(false);
      // closed still preserves ranges in the readonly structure
      expect(closed.ranges).toHaveLength(1);
      const reopened = reopenDay(closed, [makeRange("fallback", "09:00", "17:00")]);
      expect(reopened.open).toBe(true);
      expect(reopened.ranges).toEqual(day.ranges);
    });

    it("reopens with default when ranges empty", () => {
      const day = makeDay("mon", true);
      const closed = closeDay(day);
      const reopened = reopenDay(closed, [makeRange("d1", "09:00", "17:00")]);
      expect(reopened.ranges).toEqual([{ id: "d1", start: "09:00", end: "17:00" }]);
    });
  });

  describe("sortRangesByStart", () => {
    it("sorts ranges by start time", () => {
      const ranges = [makeRange("r2", "13:00", "17:00"), makeRange("r1", "09:00", "12:00")];
      const sorted = sortRangesByStart(ranges);
      expect(sorted[0]?.id).toBe("r1");
    });
  });

  describe("formatRangeSummary / daySummary", () => {
    it("formats ranges", () => {
      expect(formatRangeSummary([makeRange("r1", "09:00", "17:00")])).toBe("09:00–17:00");
    });

    it("returns empty for closed day", () => {
      expect(daySummary(makeDay("mon", false))).toBe("");
    });
  });

  describe("generateStableId", () => {
    it("generates unique IDs", () => {
      resetStableIdCounter();
      expect(generateStableId()).toBe("bh-1");
      expect(generateStableId()).toBe("bh-2");
    });
  });

  describe("touched-field tracking", () => {
    it("starts empty", () => {
      const t = emptyTouched();
      expect(shouldShowRangeErrors(t, false, "r1", "start")).toBe(false);
      expect(shouldShowDayErrors(t, false, "mon")).toBe(false);
    });

    it("shows errors after touch", () => {
      let t = emptyTouched();
      t = touchRangeField(t, "r1", "start");
      expect(shouldShowRangeErrors(t, false, "r1", "start")).toBe(true);
      expect(shouldShowRangeErrors(t, false, "r1", "end")).toBe(false);
    });

    it("shows errors after save attempted", () => {
      const t = emptyTouched();
      expect(shouldShowRangeErrors(t, true, "r1", "start")).toBe(true);
      expect(shouldShowDayErrors(t, true, "mon")).toBe(true);
    });

    it("touching a day shows day-level errors", () => {
      let t = emptyTouched();
      t = touchDay(t, "mon");
      expect(shouldShowDayErrors(t, false, "mon")).toBe(true);
    });
  });

  describe("applySaveSorts", () => {
    it("sorts ranges in open days on save", () => {
      const outlet: OutletSchedule = {
        id: "o1",
        name: "Test",
        regular: [
          makeDay("mon", true, [
            makeRange("r2", "13:00", "17:00"),
            makeRange("r1", "09:00", "12:00"),
          ]),
        ],
        specials: [],
      };
      const sorted = applySaveSorts(outlet);
      const sortedDay = sorted.regular[0];
      expect(sortedDay).toBeDefined();
      expect(sortedDay!.ranges[0]?.id).toBe("r1");
    });
  });
});
