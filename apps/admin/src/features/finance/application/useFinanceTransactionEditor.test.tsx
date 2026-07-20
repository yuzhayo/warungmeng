import { createWarungMengFinanceRepository } from "@warungmeng/data";
import type { FinanceTransaction, ManualFinanceTransactionInput } from "@warungmeng/domain";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFinanceTransactionEditor } from "./useFinanceTransactionEditor";

const INPUT: ManualFinanceTransactionInput = {
  occurredAt: "2026-07-20T08:00:00.000Z",
  direction: "outflow",
  type: "expense",
  status: "posted",
  categoryId: "ingredients",
  categoryLabel: "Bahan Baku",
  amount: { amount: 45_000, currency: "IDR" },
  paymentMethod: "cash",
  description: "Belanja test",
  referenceNumber: "TEST-01",
  attachment: null,
};

describe("useFinanceTransactionEditor", () => {
  it("creates, exactly hydrates, updates, and voids a manual transaction", async () => {
    const repository = createWarungMengFinanceRepository();
    const { result } = renderHook(() => useFinanceTransactionEditor(repository));

    act(() => result.current.openCreate("outflow"));
    let saved = false;
    await act(async () => {
      saved = await result.current.save(INPUT);
    });
    expect(saved).toBe(true);

    const created = (await repository.listManualTransactions()).find(
      (transaction) => transaction.description === INPUT.description,
    );
    expect(created).toMatchObject(INPUT);

    act(() => result.current.openEdit(created!));
    expect(result.current.editor.transaction).toEqual(created);

    await act(async () => {
      saved = await result.current.save({ ...INPUT, description: "Belanja test diperbarui" });
    });
    expect(saved).toBe(true);
    await expect(repository.getManualTransactionById(created!.id)).resolves.toMatchObject({
      description: "Belanja test diperbarui",
    });

    const updated = (await repository.getManualTransactionById(created!.id))!;
    await act(async () => {
      saved = await result.current.voidTransaction(updated);
    });
    expect(saved).toBe(true);
    await expect(repository.getManualTransactionById(created!.id)).resolves.toMatchObject({
      status: "voided",
    });
  });

  it("keeps automatic and voided transactions read-only", () => {
    const repository = createWarungMengFinanceRepository();
    const { result } = renderHook(() => useFinanceTransactionEditor(repository));
    const automatic = {
      ...INPUT,
      id: "automatic",
      source: "automatic",
      sourceReference: "order-1",
      createdAt: INPUT.occurredAt,
      updatedAt: INPUT.occurredAt,
    } as FinanceTransaction;
    const voided = { ...automatic, id: "voided", source: "manual", status: "voided" } as const;

    act(() => result.current.openEdit(automatic));
    expect(result.current.editor.open).toBe(false);
    act(() => result.current.openEdit(voided));
    expect(result.current.editor.open).toBe(false);
  });
});
