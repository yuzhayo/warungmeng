import dayjs, { type Dayjs } from "dayjs";

export const FINANCE_DATE_PRESETS = ["today", "last7", "last30", "month"] as const;
export type FinanceDatePreset = (typeof FINANCE_DATE_PRESETS)[number];
export type FinanceDateSelection = FinanceDatePreset | "custom";

export interface FinanceDateRange {
  readonly dateFrom: string;
  readonly dateTo: string;
}

export function getFinanceDatePresetRange(
  preset: FinanceDatePreset,
  now: Dayjs = dayjs(),
): FinanceDateRange {
  const dateTo = now.format("YYYY-MM-DD");
  const dateFrom =
    preset === "today"
      ? dateTo
      : preset === "last7"
        ? now.subtract(6, "day").format("YYYY-MM-DD")
        : preset === "last30"
          ? now.subtract(29, "day").format("YYYY-MM-DD")
          : now.startOf("month").format("YYYY-MM-DD");

  return { dateFrom, dateTo };
}

export function getFinanceDateSelection(
  range: FinanceDateRange,
  now: Dayjs = dayjs(),
): FinanceDateSelection {
  return (
    FINANCE_DATE_PRESETS.find((preset) => {
      const presetRange = getFinanceDatePresetRange(preset, now);
      return presetRange.dateFrom === range.dateFrom && presetRange.dateTo === range.dateTo;
    }) ?? "custom"
  );
}
