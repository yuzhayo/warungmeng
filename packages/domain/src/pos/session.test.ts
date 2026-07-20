import { describe, expect, it } from "vitest";
import {
  calculateExpectedPosCash,
  closePosSession,
  createClosedPosSession,
  openPosSession,
} from "./session";

const outlet = { id: "wm-1", name: "WARUNG MENG" };

describe("POS session", () => {
  it("opens a session with an opening balance", () => {
    const closed = createClosedPosSession(outlet);
    const open = openPosSession(outlet, 100_000, "2026-07-19T10:00:00.000Z");

    expect(closed.status).toBe("closed");
    expect(open).toMatchObject({
      status: "open",
      openingBalance: { amount: 100_000 },
      openedAt: "2026-07-19T10:00:00.000Z",
    });
  });

  it("rejects invalid opening balances", () => {
    expect(() => openPosSession(outlet, -1, "2026-07-19T10:00:00.000Z")).toThrow(RangeError);
  });

  it("calculates expected cash from opening balance and cash sales", () => {
    expect(calculateExpectedPosCash(100_000, 55_000)).toBe(155_000);
  });

  it("closes with an exact reconciliation record", () => {
    const open = openPosSession(outlet, 100_000, "2026-07-19T10:00:00.000Z");
    const outcome = closePosSession(open, {
      actualCash: 155_000,
      cashSales: 55_000,
      closedAt: "2026-07-19T18:00:00.000Z",
    });

    expect(outcome.session.status).toBe("closed");
    expect(outcome.record).toEqual({
      outlet,
      openedAt: "2026-07-19T10:00:00.000Z",
      closedAt: "2026-07-19T18:00:00.000Z",
      openingBalance: { amount: 100_000, currency: "IDR" },
      cashSales: { amount: 55_000, currency: "IDR" },
      expectedCash: { amount: 155_000, currency: "IDR" },
      actualCash: { amount: 155_000, currency: "IDR" },
      variance: { amount: 0, currency: "IDR" },
    });
  });

  it("records surplus and shortage variance", () => {
    const open = openPosSession(outlet, 100_000, "2026-07-19T10:00:00.000Z");
    const surplus = closePosSession(open, {
      actualCash: 160_000,
      cashSales: 55_000,
      closedAt: "2026-07-19T18:00:00.000Z",
    });
    const shortage = closePosSession(open, {
      actualCash: 150_000,
      cashSales: 55_000,
      closedAt: "2026-07-19T18:00:00.000Z",
    });

    expect(surplus.record.variance).toEqual({ amount: 5_000, currency: "IDR" });
    expect(shortage.record.variance).toEqual({ amount: -5_000, currency: "IDR" });
  });

  it("rejects closing a session that is not open", () => {
    expect(() =>
      closePosSession(createClosedPosSession(outlet), {
        actualCash: 0,
        cashSales: 0,
        closedAt: "2026-07-19T18:00:00.000Z",
      }),
    ).toThrow(RangeError);
  });

  it("rejects invalid reconciliation amounts", () => {
    const open = openPosSession(outlet, 100_000, "2026-07-19T10:00:00.000Z");
    expect(() =>
      closePosSession(open, { actualCash: -1, cashSales: 0, closedAt: "2026-07-19T18:00:00.000Z" }),
    ).toThrow(RangeError);
    expect(() =>
      closePosSession(open, { actualCash: 0, cashSales: -1, closedAt: "2026-07-19T18:00:00.000Z" }),
    ).toThrow(RangeError);
  });
});
