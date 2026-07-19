import { describe, expect, it } from "vitest";
import { closePosSession, createClosedPosSession, openPosSession } from "./session";

const outlet = { id: "wm-1", name: "WARUNG MENG" };

describe("POS session", () => {
  it("opens and closes a session with an opening balance", () => {
    const closed = createClosedPosSession(outlet);
    const open = openPosSession(outlet, 100_000, "2026-07-19T10:00:00.000Z");

    expect(closed.status).toBe("closed");
    expect(open).toMatchObject({
      status: "open",
      openingBalance: { amount: 100_000 },
      openedAt: "2026-07-19T10:00:00.000Z",
    });
    expect(closePosSession(open).status).toBe("closed");
  });

  it("rejects invalid opening balances", () => {
    expect(() => openPosSession(outlet, -1, "2026-07-19T10:00:00.000Z")).toThrow(RangeError);
  });
});
