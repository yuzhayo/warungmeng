import { DatePicker, Segmented } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import {
  createCustomDashboardPeriod,
  createDashboardPresetPeriod,
  type DashboardClock,
  type DashboardPeriodSelection,
  type DashboardPresetPeriod,
} from "../application/dashboardPeriod";

export interface DashboardPeriodControlProps {
  readonly clock?: DashboardClock;
  readonly selection: DashboardPeriodSelection;
  readonly onChange: (selection: DashboardPeriodSelection) => void;
}

export function DashboardPeriodControl({
  clock,
  selection,
  onChange,
}: DashboardPeriodControlProps) {
  const { t } = useTranslation();

  function handlePresetChange(value: string | number): void {
    if (value === "custom") {
      onChange(
        createCustomDashboardPeriod(
          selection.period.startDate,
          selection.period.endDate,
          selection.period.timeZone,
        ),
      );
      return;
    }
    onChange(
      createDashboardPresetPeriod(value as DashboardPresetPeriod, clock, selection.period.timeZone),
    );
  }

  return (
    <div aria-label={t("dashboard.period.label")} className="dashboard-period-control" role="group">
      <Segmented
        block
        onChange={handlePresetChange}
        options={[
          { label: t("dashboard.period.today"), value: "today" },
          { label: t("dashboard.period.last7"), value: "last-7-days" },
          { label: t("dashboard.period.last30"), value: "last-30-days" },
          { label: t("dashboard.period.thisMonth"), value: "this-month" },
          { label: t("dashboard.period.custom"), value: "custom" },
        ]}
        value={selection.preset}
      />
      {selection.preset === "custom" ? (
        <DatePicker.RangePicker
          allowClear={false}
          aria-label={t("dashboard.period.customRange")}
          format="DD/MM/YYYY"
          onChange={(dates) => {
            const startDate = dates?.[0]?.format("YYYY-MM-DD");
            const endDate = dates?.[1]?.format("YYYY-MM-DD");
            if (!startDate || !endDate) return;
            onChange(createCustomDashboardPeriod(startDate, endDate, selection.period.timeZone));
          }}
          value={[dayjs(selection.period.startDate), dayjs(selection.period.endDate)]}
        />
      ) : null}
    </div>
  );
}
