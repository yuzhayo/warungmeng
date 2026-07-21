import { describe, it, expect } from "vitest";
import { idTranslations, enTranslations } from "./translations";

describe("i18n key parity", () => {
  it("every ID key has a matching EN key", () => {
    const idKeys = Object.keys(idTranslations).sort();
    const enKeys = Object.keys(enTranslations).sort();
    expect(idKeys).toEqual(enKeys);
  });

  it("every EN key has a matching ID key", () => {
    const enKeys = Object.keys(enTranslations).sort();
    const idKeys = Object.keys(idTranslations).sort();
    expect(enKeys).toEqual(idKeys);
  });
});
