import type { Money } from "../catalog/types";
import type { PosOutlet, PosSession, PosSessionCloseInput, PosSessionCloseOutcome } from "./types";

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

export function calculateExpectedPosCash(openingBalance: number, cashSales: number): number {
  return openingBalance + cashSales;
}

export function closePosSession(
  session: PosSession,
  input: PosSessionCloseInput,
): PosSessionCloseOutcome {
  if (session.status !== "open") {
    throw new RangeError("only an open POS session can be closed");
  }
  if (!Number.isInteger(input.actualCash) || input.actualCash < 0) {
    throw new RangeError("actualCash must be a non-negative integer");
  }
  if (!Number.isInteger(input.cashSales) || input.cashSales < 0) {
    throw new RangeError("cashSales must be a non-negative integer");
  }

  const expectedCash = calculateExpectedPosCash(session.openingBalance.amount, input.cashSales);
  return {
    session: createClosedPosSession(session.outlet),
    record: {
      outlet: { ...session.outlet },
      openedAt: session.openedAt,
      closedAt: input.closedAt,
      openingBalance: { ...session.openingBalance },
      cashSales: money(input.cashSales),
      expectedCash: money(expectedCash),
      actualCash: money(input.actualCash),
      variance: money(input.actualCash - expectedCash),
    },
  };
}
