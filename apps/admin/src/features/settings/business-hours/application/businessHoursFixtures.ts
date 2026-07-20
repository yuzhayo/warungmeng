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

export const INITIAL_OUTLETS: readonly OutletSchedule[] = [OUTLET_WM];
