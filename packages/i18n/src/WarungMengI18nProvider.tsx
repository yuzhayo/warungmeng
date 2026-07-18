import { createInstance } from "i18next";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";
import {
  loadLocalePreferences,
  saveLanguage,
  saveRegionalFormat,
  type LocalePreferenceStorage,
  type RegionalFormat,
  type SupportedLanguage,
} from "./preferences";
import { enTranslations, idTranslations } from "./translations";

export interface LocaleSettings {
  readonly language: SupportedLanguage;
  readonly regionalFormat: RegionalFormat;
  readonly setLanguage: (language: SupportedLanguage) => void;
  readonly setRegionalFormat: (regionalFormat: RegionalFormat) => void;
}

export interface WarungMengI18nProviderProps extends PropsWithChildren {
  readonly storage?: LocalePreferenceStorage | null;
}

const LocaleSettingsContext = createContext<LocaleSettings | null>(null);

function getBrowserStorage(): LocalePreferenceStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function WarungMengI18nProvider({ children, storage }: WarungMengI18nProviderProps) {
  const [preferenceStorage] = useState(() =>
    storage === undefined ? getBrowserStorage() : storage,
  );
  const [initialPreferences] = useState(() => loadLocalePreferences(preferenceStorage));
  const [language, setLanguageState] = useState(initialPreferences.language);
  const [regionalFormat, setRegionalFormatState] = useState(initialPreferences.regionalFormat);
  const [i18n] = useState(() => {
    const instance = createInstance();
    void instance.use(initReactI18next).init({
      resources: {
        id: { translation: idTranslations },
        en: { translation: enTranslations },
      },
      lng: initialPreferences.language,
      fallbackLng: "id",
      supportedLngs: ["id", "en"],
      initAsync: false,
      keySeparator: false,
      interpolation: {
        escapeValue: false,
      },
    });
    return instance;
  });

  useEffect(() => {
    void i18n.changeLanguage(language);
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [i18n, language]);

  const settings = useMemo<LocaleSettings>(
    () => ({
      language,
      regionalFormat,
      setLanguage(nextLanguage) {
        setLanguageState(nextLanguage);
        saveLanguage(preferenceStorage, nextLanguage);
      },
      setRegionalFormat(nextRegionalFormat) {
        setRegionalFormatState(nextRegionalFormat);
        saveRegionalFormat(preferenceStorage, nextRegionalFormat);
      },
    }),
    [language, preferenceStorage, regionalFormat],
  );

  return (
    <LocaleSettingsContext.Provider value={settings}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LocaleSettingsContext.Provider>
  );
}

export function useLocaleSettings(): LocaleSettings {
  const settings = useContext(LocaleSettingsContext);
  if (!settings) {
    throw new Error("useLocaleSettings must be used inside WarungMengI18nProvider");
  }
  return settings;
}
