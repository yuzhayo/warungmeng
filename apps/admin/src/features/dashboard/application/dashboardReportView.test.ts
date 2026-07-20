import { describe, expect, it } from "vitest";
import {
  parseDashboardReportSearchParams,
  updateDashboardReportSearchParams,
} from "./dashboardReportView";

describe("dashboard report URL state", () => {
  it("falls back to sales for missing or unknown report values", () => {
    expect(parseDashboardReportSearchParams(new URLSearchParams())).toBe("sales");
    expect(parseDashboardReportSearchParams(new URLSearchParams("report=unknown"))).toBe("sales");
  });

  it("accepts every supported report value", () => {
    expect(parseDashboardReportSearchParams(new URLSearchParams("report=menu"))).toBe("menu");
    expect(parseDashboardReportSearchParams(new URLSearchParams("report=inventory"))).toBe(
      "inventory",
    );
  });

  it("updates report immutably while preserving period and unrelated queries", () => {
    const current = new URLSearchParams(
      "period=custom&from=2026-07-01&to=2026-07-20&source=test&report=sales",
    );
    const next = updateDashboardReportSearchParams(current, "menu");

    expect(next.toString()).toBe(
      "period=custom&from=2026-07-01&to=2026-07-20&source=test&report=menu",
    );
    expect(current.get("report")).toBe("sales");
  });
});
