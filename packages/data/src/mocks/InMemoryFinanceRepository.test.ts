import { describe, expect, it } from "vitest";
import type { FinanceTransaction, ManualFinanceTransactionInput } from "@warungmeng/domain";
import { InMemoryFinanceRepository } from "./InMemoryFinanceRepository";
import { WARUNG_MENG_FINANCE_FIXTURES } from "./WarungMengFinanceMockData";

const TEST_NOW = "2026-07-20T10:00:00.000Z";

function createInput(
  patch: Partial<ManualFinanceTransactionInput> = {},
): ManualFinanceTransactionInput {
  return {
    occurredAt: "2026-07-20T09:00:00.000Z",
    direction: "outflow",
    type: "expense",
    status: "posted",
    categoryId: "ingredients",
    categoryLabel: "Bahan Baku",
    amount: { amount: 25_000, currency: "IDR" },
    paymentMethod: "cash",
    description: "Belanja telur",
    referenceNumber: "EXP-TEST-001",
    attachment: null,
    ...patch,
  };
}

function createRepository(): InMemoryFinanceRepository {
  return new InMemoryFinanceRepository(
    WARUNG_MENG_FINANCE_FIXTURES,
    () => TEST_NOW,
    () => "finance-manual-generated",
  );
}

function createAutomaticTransaction(): FinanceTransaction {
  return {
    id: "finance-order-order-1-sale",
    occurredAt: "2026-07-20T08:00:00.000Z",
    direction: "inflow",
    type: "sale",
    source: "automatic",
    status: "posted",
    categoryId: "sales",
    categoryLabel: "Penjualan",
    amount: { amount: 30_000, currency: "IDR" },
    paymentMethod: "qris",
    description: "Penjualan WM-001",
    referenceNumber: "WM-001",
    sourceReference: "order-1",
    attachment: null,
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-20T08:00:00.000Z",
  };
}

describe("InMemoryFinanceRepository", () => {
  it("lists manual fixtures newest first and gets one by ID", async () => {
    const repository = createRepository();

    const transactions = await repository.listManualTransactions();
    expect(transactions).toHaveLength(WARUNG_MENG_FINANCE_FIXTURES.length);
    expect(transactions.map((transaction) => transaction.id)).toEqual([
      "finance-manual-utilities-pending",
      "finance-manual-gas",
      "finance-manual-ingredients",
      "finance-manual-opening-cash",
      "finance-manual-transport-voided",
    ]);
    await expect(repository.getManualTransactionById("finance-manual-gas")).resolves.toMatchObject({
      categoryId: "custom:gas",
    });
  });

  it("creates a manual transaction with injected ID and timestamps", async () => {
    const repository = createRepository();
    const input = createInput();

    await expect(repository.createManualTransaction(input)).resolves.toMatchObject({
      id: "finance-manual-generated",
      source: "manual",
      sourceReference: null,
      createdAt: TEST_NOW,
      updatedAt: TEST_NOW,
    });
    await expect(
      repository.getManualTransactionById("finance-manual-generated"),
    ).resolves.toMatchObject({ description: "Belanja telur" });
  });

  it("updates a manual transaction while preserving identity and creation time", async () => {
    const repository = createRepository();
    const current = await repository.getManualTransactionById("finance-manual-gas");

    const updated = await repository.updateManualTransaction(
      "finance-manual-gas",
      createInput({
        categoryId: "custom:gas",
        categoryLabel: "Gas Dapur",
        description: "Isi ulang LPG dan ongkir",
      }),
    );

    expect(updated).toMatchObject({
      id: "finance-manual-gas",
      createdAt: current?.createdAt,
      updatedAt: TEST_NOW,
      description: "Isi ulang LPG dan ongkir",
    });
  });

  it("soft-voids a manual transaction without removing its audit record", async () => {
    const repository = createRepository();

    await expect(
      repository.voidManualTransaction("finance-manual-gas", "2026-07-20T11:00:00.000Z"),
    ).resolves.toMatchObject({
      id: "finance-manual-gas",
      status: "voided",
      occurredAt: "2026-07-19T02:00:00.000Z",
      updatedAt: "2026-07-20T11:00:00.000Z",
    });
    await expect(repository.listManualTransactions({ status: "voided" })).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "finance-manual-gas" })]),
    );
  });

  it("applies domain search, date, status, category, and payment filters", async () => {
    const repository = createRepository();

    await expect(
      repository.listManualTransactions({
        search: "listrik",
        dateFrom: "2026-07-20",
        dateTo: "2026-07-20",
        direction: "outflow",
        type: "expense",
        categoryId: "utilities",
        paymentMethod: "bank-transfer",
        source: "manual",
        status: "pending",
      }),
    ).resolves.toMatchObject([{ id: "finance-manual-utilities-pending" }]);
  });

  it("never exposes or mutates automatic records through the manual contract", async () => {
    const automatic = createAutomaticTransaction();
    const repository = new InMemoryFinanceRepository([automatic], () => TEST_NOW);

    await expect(repository.listManualTransactions()).resolves.toEqual([]);
    await expect(repository.getManualTransactionById(automatic.id)).resolves.toBeNull();
    await expect(
      repository.updateManualTransaction(automatic.id, createInput()),
    ).resolves.toBeNull();
    await expect(repository.voidManualTransaction(automatic.id, TEST_NOW)).resolves.toBeNull();
  });

  it("returns explicit null for missing IDs and protects voided records from edits", async () => {
    const repository = createRepository();

    await expect(repository.getManualTransactionById("missing")).resolves.toBeNull();
    await expect(repository.updateManualTransaction("missing", createInput())).resolves.toBeNull();
    await expect(repository.voidManualTransaction("missing", TEST_NOW)).resolves.toBeNull();
    await expect(
      repository.updateManualTransaction("finance-manual-transport-voided", createInput()),
    ).resolves.toBeNull();
  });

  it("deep-clones seed, create input, and returned values", async () => {
    const seed = structuredClone(WARUNG_MENG_FINANCE_FIXTURES);
    const repository = new InMemoryFinanceRepository(
      seed,
      () => TEST_NOW,
      () => "generated",
    );
    const input = createInput({
      attachment: { id: "receipt", name: "receipt.pdf", mimeType: "application/pdf", size: 100 },
    });

    const created = await repository.createManualTransaction(input);
    (seed[0] as { description: string }).description = "Changed seed";
    (input.attachment as { name: string }).name = "changed.pdf";
    (created as { description: string }).description = "Changed result";
    (created.attachment as { name: string }).name = "changed-result.pdf";

    await expect(
      repository.getManualTransactionById(WARUNG_MENG_FINANCE_FIXTURES[0]!.id),
    ).resolves.not.toMatchObject({
      description: "Changed seed",
    });
    await expect(repository.getManualTransactionById("generated")).resolves.toMatchObject({
      description: "Belanja telur",
      attachment: { name: "receipt.pdf" },
    });
  });

  it("rejects invalid manual input and invalid void timestamps", async () => {
    const repository = createRepository();

    await expect(
      repository.createManualTransaction(createInput({ description: "" })),
    ).rejects.toThrow(RangeError);
    await expect(repository.voidManualTransaction("finance-manual-gas", "invalid")).rejects.toThrow(
      RangeError,
    );
  });
});
