import { describe, expect, it } from "vitest";
import {
  createDefaultCheckoutDraft,
  isCheckoutDraftValid,
  normalizeCheckoutDraft,
  normalizeCustomerPhone,
  validateCheckoutDraft,
} from "./checkoutModel";

describe("checkoutModel", () => {
  it("creates the pickup and cash defaults", () => {
    expect(createDefaultCheckoutDraft()).toMatchObject({
      fulfillment: "takeaway",
      paymentMethod: "cash",
    });
  });

  it.each([
    ["0812 3456-7890", "081234567890"],
    ["+62 (812) 3456.7890", "+6281234567890"],
  ])("normalizes Indonesian phone input %s", (input, expected) => {
    expect(normalizeCustomerPhone(input)).toBe(expected);
  });

  it.each(["", "abc", "123", "+62 hello", "1234567890123456"])(
    "rejects implausible phone input %s",
    (input) => expect(normalizeCustomerPhone(input)).toBeNull(),
  );

  it("normalizes customer fields without changing fixed checkout choices", () => {
    expect(
      normalizeCheckoutDraft({
        customerName: "  Budi   Santoso ",
        customerPhone: " 0812-3456-7890 ",
        customerNote: "  tanpa sambal ",
        fulfillment: "takeaway",
        paymentMethod: "cash",
      }),
    ).toEqual({
      customerName: "Budi Santoso",
      customerPhone: "081234567890",
      customerNote: "tanpa sambal",
      fulfillment: "takeaway",
      paymentMethod: "cash",
    });
  });

  it("returns field-keyed errors", () => {
    const draft = createDefaultCheckoutDraft();
    expect(validateCheckoutDraft(draft)).toEqual({
      customerName: "required",
      customerPhone: "invalid",
    });
    expect(isCheckoutDraftValid(draft)).toBe(false);
  });
});
