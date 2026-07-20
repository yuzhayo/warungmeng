import { describe, expect, it } from "vitest";
import type { ManualFinanceTransactionInput } from "./types";
import {
  isManualFinanceTransactionValid,
  MAX_FINANCE_ATTACHMENT_BYTES,
  validateManualFinanceTransaction,
} from "./validation";

function createInput(
  patch: Partial<ManualFinanceTransactionInput> = {},
): ManualFinanceTransactionInput {
  return {
    occurredAt: "2026-07-20T08:30:00.000Z",
    direction: "outflow",
    type: "expense",
    status: "posted",
    categoryId: "ingredients",
    categoryLabel: "Bahan Baku",
    amount: { amount: 25_000, currency: "IDR" },
    paymentMethod: "cash",
    description: "Belanja sayur",
    referenceNumber: "EXP-001",
    attachment: null,
    ...patch,
  };
}

describe("manual finance transaction validation", () => {
  it("accepts a valid expense and zero-value adjustment", () => {
    expect(isManualFinanceTransactionValid(createInput())).toBe(true);
    expect(
      isManualFinanceTransactionValid(
        createInput({
          direction: "inflow",
          type: "adjustment",
          categoryId: "inflow-adjustment",
          categoryLabel: "Penyesuaian Masuk",
          amount: { amount: 0, currency: "IDR" },
        }),
      ),
    ).toBe(true);
  });

  it("rejects invalid, negative, fractional, and unsafe amounts", () => {
    expect(
      validateManualFinanceTransaction(createInput({ amount: { amount: -1, currency: "IDR" } })),
    ).toHaveProperty("amount");
    expect(
      validateManualFinanceTransaction(createInput({ amount: { amount: 1.5, currency: "IDR" } })),
    ).toHaveProperty("amount");
    expect(
      validateManualFinanceTransaction(
        createInput({ amount: { amount: Number.MAX_SAFE_INTEGER + 1, currency: "IDR" } }),
      ),
    ).toHaveProperty("amount");
  });

  it("requires valid date, category, label, and description", () => {
    const errors = validateManualFinanceTransaction(
      createInput({ occurredAt: "invalid", categoryId: "", categoryLabel: " ", description: "" }),
    );

    expect(errors).toMatchObject({
      occurredAt: expect.any(String),
      categoryId: expect.any(String),
      categoryLabel: expect.any(String),
      description: expect.any(String),
    });
  });

  it("rejects a transaction type that does not match its direction", () => {
    expect(validateManualFinanceTransaction(createInput({ type: "manual-income" }))).toHaveProperty(
      "type",
    );
    expect(
      validateManualFinanceTransaction(
        createInput({
          direction: "inflow",
          type: "expense",
          categoryId: "other-income",
          categoryLabel: "Pemasukan Lain",
        }),
      ),
    ).toHaveProperty("type");
  });

  it("rejects a built-in category from the opposite direction", () => {
    expect(
      validateManualFinanceTransaction(
        createInput({
          direction: "inflow",
          type: "manual-income",
          categoryId: "ingredients",
        }),
      ),
    ).toHaveProperty("categoryId");
  });

  it("accepts a custom category snapshot with a non-empty label", () => {
    expect(
      isManualFinanceTransactionValid(
        createInput({ categoryId: "custom:gas", categoryLabel: "Gas Dapur" }),
      ),
    ).toBe(true);
  });

  it("accepts image and PDF attachment metadata", () => {
    expect(
      isManualFinanceTransactionValid(
        createInput({
          attachment: { id: "receipt-1", name: "receipt.webp", mimeType: "image/webp", size: 100 },
        }),
      ),
    ).toBe(true);
    expect(
      isManualFinanceTransactionValid(
        createInput({
          attachment: {
            id: "receipt-2",
            name: "receipt.pdf",
            mimeType: "application/pdf",
            size: 100,
          },
        }),
      ),
    ).toBe(true);
  });

  it("rejects unsupported, incomplete, and oversized attachments", () => {
    expect(
      validateManualFinanceTransaction(
        createInput({
          attachment: { id: "receipt-1", name: "receipt.txt", mimeType: "text/plain", size: 100 },
        }),
      ),
    ).toHaveProperty("attachment");
    expect(
      validateManualFinanceTransaction(
        createInput({
          attachment: {
            id: "",
            name: "receipt.pdf",
            mimeType: "application/pdf",
            size: MAX_FINANCE_ATTACHMENT_BYTES + 1,
          },
        }),
      ),
    ).toHaveProperty("attachment");
  });
});
