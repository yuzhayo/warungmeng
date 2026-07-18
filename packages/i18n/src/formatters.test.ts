import { describe, expect, it } from "vitest";
import { formatDate, formatRupiah, formatTime } from "./formatters";

describe("regional formatters", () => {
  const value = new Date(2026, 6, 18, 14, 30, 45);

  it("keeps Indonesian currency separators by default", () => {
    const formatted = formatRupiah(22_000).replace(/\u00a0/g, " ");

    expect(formatted).toContain("Rp");
    expect(formatted).toContain("22.000");
    expect(formatted).not.toContain("22,000");
  });

  it("formats date and time independently from UI language", () => {
    expect(formatDate(value)).toBe("18/07/2026");
    expect(formatTime(value)).toMatch(/^14[.:]30[.:]45$/);
  });

  it("only changes separators when regional format is explicitly changed", () => {
    expect(formatRupiah(22_000, { regionalFormat: "en-US" })).toContain("22,000");
  });
});
