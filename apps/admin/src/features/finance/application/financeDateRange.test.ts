import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { getFinanceDatePresetRange, getFinanceDateSelection } from "./financeDateRange";

const NOW = dayjs("2026-07-20T12:00:00");

describe("finance date ranges", () => {
  it.each([
    ["today", { dateFrom: "2026-07-20", dateTo: "2026-07-20" }],
    ["last7", { dateFrom: "2026-07-14", dateTo: "2026-07-20" }],
    ["last30", { dateFrom: "2026-06-21", dateTo: "2026-07-20" }],
    ["month", { dateFrom: "2026-07-01", dateTo: "2026-07-20" }],
  ] as const)("builds an inclusive %s preset", (preset, expected) => {
    expect(getFinanceDatePresetRange(preset, NOW)).toEqual(expected);
  });

  it("recognizes presets and preserves custom ranges", () => {
    expect(getFinanceDateSelection({ dateFrom: "2026-07-14", dateTo: "2026-07-20" }, NOW)).toBe(
      "last7",
    );
    expect(getFinanceDateSelection({ dateFrom: "2026-07-10", dateTo: "2026-07-18" }, NOW)).toBe(
      "custom",
    );
  });
});
