import type { OutletSchedule, DaySchedule } from "./businessHoursModel";
import { BH_WEEKDAYS, BH_DEFAULT_RANGE } from "./businessHoursModel";

function initialRanges(idPrefix: string) {
  return [{ id: `${idPrefix}-r1`, start: BH_DEFAULT_RANGE.start, end: BH_DEFAULT_RANGE.end }];
}

function makeRegularSchedule(idPrefix: string): DaySchedule[] {
  return BH_WEEKDAYS.map((wd) => ({
    weekday: wd,
    open: true,
    ranges: initialRanges(`${idPrefix}-${wd}`),
  }));
}

export const OUTLET_WM: OutletSchedule = {
  id: "wm-1",
  name: "WARUNG MENG",
  regular: makeRegularSchedule("wm"),
  specials: [],
};

export const OUTLET_WM2: OutletSchedule = {
  id: "wm-2",
  name: "WARUNG MENG 2",
  regular: [
    { weekday: "mon", open: true, ranges: [{ id: "wm2-mon-r1", start: "08:00", end: "20:00" }] },
    { weekday: "tue", open: true, ranges: [{ id: "wm2-tue-r1", start: "08:00", end: "20:00" }] },
    { weekday: "wed", open: true, ranges: [{ id: "wm2-wed-r1", start: "08:00", end: "20:00" }] },
    { weekday: "thu", open: true, ranges: [{ id: "wm2-thu-r1", start: "08:00", end: "20:00" }] },
    { weekday: "fri", open: true, ranges: [{ id: "wm2-fri-r1", start: "08:00", end: "22:00" }] },
    { weekday: "sat", open: true, ranges: [{ id: "wm2-sat-r1", start: "08:00", end: "22:00" }] },
    { weekday: "sun", open: false, ranges: [{ id: "wm2-sun-r1", start: "09:00", end: "17:00" }] },
  ],
  specials: [],
};

export const INITIAL_OUTLETS: readonly [OutletSchedule, OutletSchedule] = [OUTLET_WM, OUTLET_WM2];
