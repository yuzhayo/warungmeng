import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  parseDashboardPeriodSearchParams,
  updateDashboardPeriodSearchParams,
  type DashboardClock,
  type DashboardPeriodSelection,
} from "./dashboardPeriod";

export interface DashboardPeriodSearchResult {
  readonly selection: DashboardPeriodSelection;
  readonly setSelection: (selection: DashboardPeriodSelection) => void;
}

/** Keeps the dashboard period in the URL while preserving unrelated query parameters. */
export function useDashboardPeriodSearch(clock?: DashboardClock): DashboardPeriodSearchResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const selection = useMemo(
    () => parseDashboardPeriodSearchParams(new URLSearchParams(searchKey), clock),
    [clock, searchKey],
  );
  const setSelection = useCallback(
    (nextSelection: DashboardPeriodSelection) => {
      setSearchParams(
        updateDashboardPeriodSearchParams(new URLSearchParams(searchKey), nextSelection),
      );
    },
    [searchKey, setSearchParams],
  );

  return { selection, setSelection };
}
