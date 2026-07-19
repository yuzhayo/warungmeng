import { describe, expect, it } from "vitest";
import { areInventoryUnitsCompatible, convertInventoryQuantity } from "./units";

describe("inventory unit conversion", () => {
  it("converts kilograms to grams", () => {
    expect(convertInventoryQuantity(1.5, "kg", "g")).toBe(1500);
  });

  it("converts millilitres to litres", () => {
    expect(convertInventoryQuantity(750, "ml", "l")).toBe(0.75);
  });

  it("rejects incompatible dimensions", () => {
    expect(areInventoryUnitsCompatible("g", "ml")).toBe(false);
    expect(() => convertInventoryQuantity(1, "g", "ml")).toThrow(RangeError);
  });

  it("rejects negative quantities", () => {
    expect(() => convertInventoryQuantity(-1, "kg", "g")).toThrow(RangeError);
  });
});
