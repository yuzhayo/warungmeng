import { describe, expect, it } from "vitest";
import { createPosOrderNumber } from "./posCashierModel";

describe("POS cashier model", () => {
  it("creates a deterministic daily order number", () => {
    expect(createPosOrderNumber(new Date(2026, 6, 19, 10, 30, 45), 7)).toBe(
      "WM-POS-260719-103045-007",
    );
  });

  it("rejects invalid sequences", () => {
    expect(() => createPosOrderNumber(new Date(), 0)).toThrow(RangeError);
  });
});
