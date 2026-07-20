import { DatePicker, Segmented } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useTranslation } from "react-i18next";
import {
  getFinanceDatePresetRange,
  getFinanceDateSelection,
  type FinanceDatePreset,
  type FinanceDateRange,
} from "../application/financeDateRange";

interface FinanceDateRangeControlProps {
  readonly range: FinanceDateRange;
  readonly onChange: (range: FinanceDateRange) => void;
  readonly now?: Dayjs;
}

export function FinanceDateRangeControl({
  range,
  onChange,
  now = dayjs(),
}: FinanceDateRangeControlProps) {
  const { t } = useTranslation();
  const selection = getFinanceDateSelection(range, now);

  function selectPreset(value: string | number): void {
    onChange(getFinanceDatePresetRange(value as FinanceDatePreset, now));
  }

  return (
    <div aria-label={t("finance.period.label")} className="finance-date-range-control" role="group">
      <Segmented
        onChange={selectPreset}
        options={[
          { label: t("finance.period.today"), value: "today" },
          { label: t("finance.period.last7"), value: "last7" },
          { label: t("finance.period.last30"), value: "last30" },
          { label: t("finance.period.month"), value: "month" },
        ]}
        value={selection}
      />
      <DatePicker.RangePicker
        allowClear={false}
        aria-label={t("finance.filters.dateRange")}
        onChange={(dates) => {
          const dateFrom = dates?.[0]?.format("YYYY-MM-DD");
          const dateTo = dates?.[1]?.format("YYYY-MM-DD");
          if (dateFrom && dateTo) onChange({ dateFrom, dateTo });
        }}
        value={[dayjs(range.dateFrom), dayjs(range.dateTo)]}
      />
    </div>
  );
}
