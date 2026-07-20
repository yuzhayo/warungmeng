import { describe, expect, it } from "vitest";
import {
  createCustomDashboardPeriod,
  createDashboardPresetPeriod,
  parseDashboardPeriodSearchParams,
  updateDashboardPeriodSearchParams,
  type DashboardClock,
} from "./dashboardPeriod";

const fixedClock: DashboardClock = () => new Date("2026-07-20T03:00:00.000Z");

describe("dashboard period URL model", () => {
  it.each([
    ["today", "2026-07-20", "2026-07-20"],
    ["last-7-days", "2026-07-14", "2026-07-20"],
    ["last-30-days", "2026-06-21", "2026-07-20"],
    ["this-month", "2026-07-01", "2026-07-20"],
  ] as const)("resolves %s with an injected clock", (preset, startDate, endDate) => {
    expect(createDashboardPresetPeriod(preset, fixedClock)).toEqual({
      preset,
      period: { startDate, endDate, timeZone: "Asia/Jakarta" },
    });
  });

  it("uses the Warung Meng timezone at the UTC day boundary", () => {
    const clock = () => new Date("2026-07-19T18:00:00.000Z");
    expect(createDashboardPresetPeriod("today", clock).period.startDate).toBe("2026-07-20");
  });

  it("crosses year boundaries without losing inclusive days", () => {
    const yearBoundaryClock = () => new Date("2027-01-03T03:00:00.000Z");

    expect(createDashboardPresetPeriod("last-7-days", yearBoundaryClock).period).toEqual({
      startDate: "2026-12-28",
      endDate: "2027-01-03",
      timeZone: "Asia/Jakarta",
    });
    expect(createDashboardPresetPeriod("last-30-days", yearBoundaryClock).period.startDate).toBe(
      "2026-12-05",
    );
  });

  it("handles a leap-day boundary", () => {
    const leapDayClock = () => new Date("2028-03-01T03:00:00.000Z");
    expect(createDashboardPresetPeriod("last-7-days", leapDayClock).period.startDate).toBe(
      "2028-02-24",
    );
  });

  it("round-trips a valid custom range while preserving unrelated params", () => {
    const selection = createCustomDashboardPeriod("2026-07-01", "2026-07-15");
    const params = updateDashboardPeriodSearchParams(new URLSearchParams("report=menu"), selection);

    expect(params.toString()).toBe("report=menu&period=custom&from=2026-07-01&to=2026-07-15");
    expect(parseDashboardPeriodSearchParams(params, fixedClock)).toEqual(selection);
  });

  it("falls back to today for invalid or incomplete custom params", () => {
    expect(
      parseDashboardPeriodSearchParams(
        new URLSearchParams("period=custom&from=2026-07-20&to=2026-07-01"),
        fixedClock,
      ),
    ).toEqual(createDashboardPresetPeriod("today", fixedClock));
    expect(
      parseDashboardPeriodSearchParams(
        new URLSearchParams("period=custom&from=2026-07-01"),
        fixedClock,
      ),
    ).toEqual(createDashboardPresetPeriod("today", fixedClock));
  });

  it("falls back to today for an unknown period value", () => {
    expect(
      parseDashboardPeriodSearchParams(new URLSearchParams("period=garbage"), fixedClock),
    ).toEqual(createDashboardPresetPeriod("today", fixedClock));
  });

  it("removes stale custom dates when a preset is selected", () => {
    const next = updateDashboardPeriodSearchParams(
      new URLSearchParams("period=custom&from=2026-07-01&to=2026-07-15&report=sales"),
      createDashboardPresetPeriod("last-7-days", fixedClock),
    );

    expect(next.get("period")).toBe("last-7-days");
    expect(next.has("from")).toBe(false);
    expect(next.has("to")).toBe(false);
    expect(next.get("report")).toBe("sales");
  });

  it("rejects an invalid custom date before it reaches the URL", () => {
    expect(() => createCustomDashboardPeriod("2026-02-30", "2026-03-01")).toThrow(RangeError);
  });
});
