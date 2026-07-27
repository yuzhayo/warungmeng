import type { ReportingPeriod, ReportingSnapshot } from "@warungmeng/domain";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DASHBOARD_DATA_SOURCES,
  applyDashboardSourceResult,
  buildDashboardReportingSnapshot,
  hasDashboardSource,
  loadDashboardSource,
  normalizeDashboardSourceError,
  type DashboardDataSource,
  type DashboardSourceCache,
  type DashboardSourceError,
  type DashboardSourceErrors,
  type DashboardSourceResult,
} from "./dashboardReportData.core";
import type { DashboardRepositoriesPort } from "./ports/dashboardRepositoriesPort";

export { DASHBOARD_DATA_SOURCES, DASHBOARD_OUTLET_ID } from "./dashboardReportData.core";
export type {
  DashboardDataSource,
  DashboardSourceError,
  DashboardSourceErrors,
} from "./dashboardReportData.core";
export type { DashboardRepositoriesPort } from "./ports/dashboardRepositoriesPort";
export type DashboardReportRepositories = DashboardRepositoriesPort;

export type DashboardReportLoadStatus = "loading" | "ready" | "partial" | "error";

export interface DashboardReportDataState {
  readonly status: DashboardReportLoadStatus;
  readonly period: ReportingPeriod;
  readonly snapshot: ReportingSnapshot | null;
  readonly failedSources: readonly DashboardDataSource[];
  readonly errors: DashboardSourceErrors;
  readonly retrying: boolean;
}

export interface DashboardReportDataResult extends DashboardReportDataState {
  readonly retry: () => void;
}

interface DashboardSourceCacheState {
  readonly periodKey: string;
  readonly values: DashboardSourceCache;
  readonly failedSources: readonly DashboardDataSource[];
  readonly errors: DashboardSourceErrors;
}

interface StoredDashboardState {
  readonly periodKey: string;
  readonly state: DashboardReportDataState;
}

interface DashboardRequestBatch {
  readonly periodKey: string;
  readonly reloadToken: number;
  readonly targetsKey: string;
  readonly repositories: DashboardRepositoriesPort;
  readonly promise: Promise<PromiseSettledResult<DashboardSourceResult>[]>;
}

function copyPeriod(period: ReportingPeriod): ReportingPeriod {
  return { ...period };
}

function createLoadingState(period: ReportingPeriod): DashboardReportDataState {
  return {
    status: "loading",
    period: copyPeriod(period),
    snapshot: null,
    failedSources: [],
    errors: {},
    retrying: false,
  };
}

function haveSameRepositoryIdentity(
  left: DashboardRepositoriesPort,
  right: DashboardRepositoriesPort,
): boolean {
  return (
    left.orders === right.orders &&
    left.finance === right.finance &&
    left.inventory === right.inventory &&
    left.catalog === right.catalog
  );
}

function canReuseBatch(
  batch: DashboardRequestBatch,
  periodKey: string,
  reloadToken: number,
  targetsKey: string,
  repositories: DashboardRepositoriesPort,
): boolean {
  return (
    batch.periodKey === periodKey &&
    batch.reloadToken === reloadToken &&
    batch.targetsKey === targetsKey &&
    haveSameRepositoryIdentity(batch.repositories, repositories)
  );
}

/**
 * Composes all dashboard repositories into one normalized reporting snapshot. Repository
 * instances must remain stable; the hook intentionally reloads when an injected instance changes.
 */
export function useDashboardReportData(
  period: ReportingPeriod,
  repositories: DashboardRepositoriesPort,
): DashboardReportDataResult {
  const { startDate, endDate, timeZone } = period;
  const { catalog, finance, inventory, orders } = repositories;
  const periodKey = `${startDate}|${endDate}|${timeZone}`;
  const [reloadToken, setReloadToken] = useState(0);
  const [stored, setStored] = useState<StoredDashboardState>(() => ({
    periodKey,
    state: createLoadingState(period),
  }));
  const cacheRef = useRef<DashboardSourceCacheState | null>(null);
  const retryTargetsRef = useRef<readonly DashboardDataSource[] | null>(null);
  const inFlightBatchRef = useRef<DashboardRequestBatch | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestPeriod = { startDate, endDate, timeZone };
    const sourceRepositories = { catalog, finance, inventory, orders };
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    let active = true;

    const previous = cacheRef.current;
    const requestedRetryTargets = retryTargetsRef.current;
    const samePeriod = previous?.periodKey === periodKey;
    const isRetry =
      samePeriod && requestedRetryTargets !== null && requestedRetryTargets.length > 0;
    const targets = isRetry ? requestedRetryTargets : DASHBOARD_DATA_SOURCES;
    const targetsKey = targets.join("|");
    const baseCache: DashboardSourceCache = isRetry ? { ...previous.values } : {};
    const previousFailures = isRetry ? previous.failedSources : [];
    const previousErrors: DashboardSourceErrors = isRetry ? previous.errors : {};

    setStored((current) => ({
      periodKey,
      state:
        isRetry && current.periodKey === periodKey
          ? { ...current.state, retrying: true }
          : createLoadingState(requestPeriod),
    }));

    // React StrictMode replays effects in development. Reuse the same in-flight batch so the
    // replay verifies cleanup behavior without duplicating repository reads or HPP calculations.
    const existingBatch = inFlightBatchRef.current;
    const batch =
      existingBatch &&
      canReuseBatch(existingBatch, periodKey, reloadToken, targetsKey, sourceRepositories)
        ? existingBatch
        : {
            periodKey,
            reloadToken,
            targetsKey,
            repositories: sourceRepositories,
            promise: Promise.allSettled(
              targets.map((source) => loadDashboardSource(source, sourceRepositories)),
            ),
          };
    inFlightBatchRef.current = batch;

    void batch.promise.then((results) => {
      if (!active || requestIdRef.current !== requestId) return;

      let nextCache = baseCache;
      const failures = new Set<DashboardDataSource>(previousFailures);
      const errors: Partial<Record<DashboardDataSource, DashboardSourceError>> = {
        ...previousErrors,
      };
      results.forEach((result, index) => {
        const source = targets[index];
        if (!source) return;
        if (result.status === "fulfilled") {
          nextCache = applyDashboardSourceResult(nextCache, result.value);
          if (result.value.error) {
            failures.add(source);
            errors[source] = result.value.error;
          } else {
            failures.delete(source);
            delete errors[source];
          }
        } else {
          failures.add(source);
          errors[source] = normalizeDashboardSourceError(source, result.reason);
        }
      });

      const failedSources = DASHBOARD_DATA_SOURCES.filter((source) => failures.has(source));
      const availableSourceCount = DASHBOARD_DATA_SOURCES.filter((source) =>
        hasDashboardSource(nextCache, source),
      ).length;
      const snapshot =
        availableSourceCount === 0
          ? null
          : buildDashboardReportingSnapshot(requestPeriod, nextCache);
      const status: DashboardReportLoadStatus =
        failedSources.length === 0 ? "ready" : snapshot === null ? "error" : "partial";

      cacheRef.current = { periodKey, values: nextCache, failedSources, errors };
      setStored({
        periodKey,
        state: {
          status,
          period: copyPeriod(requestPeriod),
          snapshot,
          failedSources,
          errors,
          retrying: false,
        },
      });
    });

    void batch.promise.finally(() => {
      if (inFlightBatchRef.current !== batch) return;
      inFlightBatchRef.current = null;
      retryTargetsRef.current = null;
    });

    return () => {
      // Results cannot cancel repository work yet, so both identity and activity guards prevent
      // an older request from committing after a period or repository change.
      active = false;
    };
  }, [catalog, endDate, finance, inventory, orders, periodKey, reloadToken, startDate, timeZone]);

  const visibleState =
    stored.periodKey === periodKey
      ? stored.state
      : createLoadingState({ startDate, endDate, timeZone });
  const retry = useCallback(() => {
    if (visibleState.retrying || visibleState.failedSources.length === 0) return;
    retryTargetsRef.current = [...visibleState.failedSources];
    setReloadToken((current) => current + 1);
  }, [visibleState.failedSources, visibleState.retrying]);

  return { ...visibleState, retry };
}
