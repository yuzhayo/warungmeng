export const LANGUAGE_STORAGE_KEY = "wm.language";
export const REGIONAL_FORMAT_STORAGE_KEY = "wm.regional-format";

export const supportedLanguages = ["id", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const supportedRegionalFormats = ["id-ID", "en-US"] as const;
export type RegionalFormat = (typeof supportedRegionalFormats)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "id";
export const DEFAULT_REGIONAL_FORMAT: RegionalFormat = "id-ID";

export interface LocalePreferences {
  readonly language: SupportedLanguage;
  readonly regionalFormat: RegionalFormat;
}

export interface LocalePreferenceStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function includesValue<TValue extends string>(
  values: readonly TValue[],
  candidate: string | null,
): candidate is TValue {
  return candidate !== null && values.includes(candidate as TValue);
}

export function loadLocalePreferences(storage: LocalePreferenceStorage | null): LocalePreferences {
  if (!storage) {
    return {
      language: DEFAULT_LANGUAGE,
      regionalFormat: DEFAULT_REGIONAL_FORMAT,
    };
  }

  try {
    const storedLanguage = storage.getItem(LANGUAGE_STORAGE_KEY);
    const storedRegionalFormat = storage.getItem(REGIONAL_FORMAT_STORAGE_KEY);

    return {
      language: includesValue(supportedLanguages, storedLanguage)
        ? storedLanguage
        : DEFAULT_LANGUAGE,
      regionalFormat: includesValue(supportedRegionalFormats, storedRegionalFormat)
        ? storedRegionalFormat
        : DEFAULT_REGIONAL_FORMAT,
    };
  } catch {
    return {
      language: DEFAULT_LANGUAGE,
      regionalFormat: DEFAULT_REGIONAL_FORMAT,
    };
  }
}

export function saveLanguage(
  storage: LocalePreferenceStorage | null,
  language: SupportedLanguage,
): void {
  try {
    storage?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function saveRegionalFormat(
  storage: LocalePreferenceStorage | null,
  regionalFormat: RegionalFormat,
): void {
  try {
    storage?.setItem(REGIONAL_FORMAT_STORAGE_KEY, regionalFormat);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}
