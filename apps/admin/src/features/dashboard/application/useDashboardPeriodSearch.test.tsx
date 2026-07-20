import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { describe, expect, it } from "vitest";
import { createCustomDashboardPeriod, createDashboardPresetPeriod } from "./dashboardPeriod";
import { useDashboardPeriodSearch } from "./useDashboardPeriodSearch";

const clock = () => new Date("2026-07-20T12:00:00.000Z");

function Wrapper({ children }: PropsWithChildren) {
  return (
    <MemoryRouter initialEntries={["/?period=last-7-days&source=bookmark"]}>
      {children}
    </MemoryRouter>
  );
}

describe("useDashboardPeriodSearch", () => {
  it("updates presets while preserving unrelated URL parameters", () => {
    const { result } = renderHook(
      () => ({ period: useDashboardPeriodSearch(clock), location: useLocation() }),
      { wrapper: Wrapper },
    );

    act(() => result.current.period.setSelection(createDashboardPresetPeriod("today", clock)));

    expect(result.current.location.search).toBe("?period=today&source=bookmark");
  });

  it("serializes a custom range into the URL", () => {
    const { result } = renderHook(
      () => ({ period: useDashboardPeriodSearch(clock), location: useLocation() }),
      { wrapper: Wrapper },
    );

    act(() =>
      result.current.period.setSelection(createCustomDashboardPeriod("2026-07-01", "2026-07-10")),
    );

    expect(result.current.location.search).toBe(
      "?period=custom&source=bookmark&from=2026-07-01&to=2026-07-10",
    );
  });
});
