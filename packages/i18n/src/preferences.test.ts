import { describe, expect, it } from "vitest";
import {
  DEFAULT_LANGUAGE,
  DEFAULT_REGIONAL_FORMAT,
  LANGUAGE_STORAGE_KEY,
  REGIONAL_FORMAT_STORAGE_KEY,
  loadLocalePreferences,
  saveLanguage,
  saveRegionalFormat,
  type LocalePreferenceStorage,
} from "./preferences";

function createStorage(initial: Record<string, string> = {}): {
  readonly storage: LocalePreferenceStorage;
  readonly values: Map<string, string>;
} {
  const values = new Map(Object.entries(initial));
  return {
    values,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
}

describe("locale preferences", () => {
  it("loads language and regional format independently", () => {
    const { storage } = createStorage({
      [LANGUAGE_STORAGE_KEY]: "en",
      [REGIONAL_FORMAT_STORAGE_KEY]: "id-ID",
    });

    expect(loadLocalePreferences(storage)).toEqual({
      language: "en",
      regionalFormat: "id-ID",
    });
  });

  it("falls back safely for unsupported stored values", () => {
    const { storage } = createStorage({
      [LANGUAGE_STORAGE_KEY]: "unknown",
      [REGIONAL_FORMAT_STORAGE_KEY]: "unknown",
    });

    expect(loadLocalePreferences(storage)).toEqual({
      language: DEFAULT_LANGUAGE,
      regionalFormat: DEFAULT_REGIONAL_FORMAT,
    });
  });

  it("persists each preference under a separate key", () => {
    const { storage, values } = createStorage();

    saveLanguage(storage, "en");
    saveRegionalFormat(storage, "id-ID");

    expect(values.get(LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(values.get(REGIONAL_FORMAT_STORAGE_KEY)).toBe("id-ID");
  });
});
