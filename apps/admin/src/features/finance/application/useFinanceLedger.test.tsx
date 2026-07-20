import {
  createWarungMengFinanceRepository,
  createWarungMengOrderRepository,
} from "@warungmeng/data";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useFinanceLedger } from "./useFinanceLedger";

describe("useFinanceLedger", () => {
  it("loads one normalized ledger for the active outlet", async () => {
    const orders = createWarungMengOrderRepository();
    const manualFinance = createWarungMengFinanceRepository();
    const listOrders = vi.spyOn(orders, "listOrders");
    const { result } = renderHook(() => useFinanceLedger(orders, manualFinance));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(false);
    expect(result.current.transactions.length).toBeGreaterThan(5);
    expect(result.current.transactions.some((item) => item.source === "manual")).toBe(true);
    expect(result.current.transactions.some((item) => item.source === "automatic")).toBe(true);
    expect(listOrders).toHaveBeenCalledWith({ outletId: "wm-1" });
    expect(new Set(result.current.transactions.map((item) => item.id)).size).toBe(
      result.current.transactions.length,
    );
  });

  it("exposes a safe error and retries both repositories", async () => {
    const orders = createWarungMengOrderRepository();
    const manualFinance = createWarungMengFinanceRepository();
    const listOrders = vi
      .spyOn(orders, "listOrders")
      .mockRejectedValueOnce(new Error("private failure"));
    const listManual = vi.spyOn(manualFinance, "listManualTransactions");
    const { result } = renderHook(() => useFinanceLedger(orders, manualFinance));

    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.transactions).toEqual([]);

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(false);
    expect(listOrders).toHaveBeenCalledTimes(2);
    expect(listManual).toHaveBeenCalledTimes(2);
  });
});
