import type { Money } from "../catalog/types";
import type { PosOutlet, PosSession } from "./types";

function money(amount: number): Money {
  return { amount, currency: "IDR" };
}

export function createClosedPosSession(outlet: PosOutlet): PosSession {
  return { status: "closed", outlet: { ...outlet }, openingBalance: money(0), openedAt: null };
}

export function openPosSession(
  outlet: PosOutlet,
  openingBalance: number,
  openedAt: string,
): PosSession {
  if (!Number.isInteger(openingBalance) || openingBalance < 0) {
    throw new RangeError("openingBalance must be a non-negative integer");
  }

  return {
    status: "open",
    outlet: { ...outlet },
    openingBalance: money(openingBalance),
    openedAt,
  };
}

export function closePosSession(session: PosSession): PosSession {
  return createClosedPosSession(session.outlet);
}
