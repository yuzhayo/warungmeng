import { describe, expect, it } from "vitest";
import { getSelectedNavigationKey } from "./navigation";

describe("getSelectedNavigationKey", () => {
  it.each([
    ["/", "/"],
    ["/menu", "/menu"],
    ["/menu/new", "/menu"],
    ["/inventory", "/inventory"],
    ["/pos", "/pos"],
    ["/settings/theme", "/settings"],
    ["/unknown", "/"],
  ])("maps %s to %s", (pathname, expectedKey) => {
    expect(getSelectedNavigationKey(pathname)).toBe(expectedKey);
  });
});
