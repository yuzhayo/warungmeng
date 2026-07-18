import { App as AntdApp, ConfigProvider } from "antd";
import type { Locale } from "antd/es/locale";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type PropsWithChildren,
} from "react";
import { createAdminTheme } from "./createAdminTheme";
import { DEFAULT_ADMIN_CUSTOM_THEME, DEFAULT_ADMIN_THEME_SETTINGS } from "./themeDefaults";
import {
  adminThemeSettingsEqual,
  loadAdminThemeSettings,
  persistAdminThemeSettings,
} from "./themeStorage";
import type {
  AdminCustomThemePatch,
  AdminThemeDensity,
  AdminThemeMode,
  AdminThemeSettings,
} from "./themeTypes";

export interface AdminThemeContextValue {
  readonly draft: AdminThemeSettings;
  readonly saved: AdminThemeSettings;
  readonly hasChanges: boolean;
  readonly setMode: (mode: AdminThemeMode) => void;
  readonly updateCustomTheme: (patch: AdminCustomThemePatch) => void;
  readonly save: () => void;
  readonly cancel: () => void;
  readonly resetDraft: () => void;
}

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

export type AdminThemeProviderProps = PropsWithChildren<{
  readonly locale?: Locale;
  readonly storage?: ThemeStorage | null;
}>;

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

type AdminSpacingStyle = CSSProperties & {
  readonly "--wm-space-xs": string;
  readonly "--wm-space-sm": string;
  readonly "--wm-space-md": string;
  readonly "--wm-space-lg": string;
  readonly "--wm-space-xl": string;
};

const ADMIN_SPACING_BY_DENSITY: Record<AdminThemeDensity, AdminSpacingStyle> = {
  normal: {
    "--wm-space-xs": "0.5rem",
    "--wm-space-sm": "0.75rem",
    "--wm-space-md": "1rem",
    "--wm-space-lg": "1.5rem",
    "--wm-space-xl": "2rem",
  },
  compact: {
    "--wm-space-xs": "0.25rem",
    "--wm-space-sm": "0.5rem",
    "--wm-space-md": "0.75rem",
    "--wm-space-lg": "1rem",
    "--wm-space-xl": "1.5rem",
  },
};

function getDefaultStorage(): ThemeStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function AdminThemeProvider({
  children,
  locale,
  storage = getDefaultStorage(),
}: AdminThemeProviderProps) {
  const [saved, setSaved] = useState<AdminThemeSettings>(() => loadAdminThemeSettings(storage));
  const [draft, setDraft] = useState<AdminThemeSettings>(saved);
  const hasChanges = !adminThemeSettingsEqual(saved, draft);
  const themeConfig = useMemo(() => createAdminTheme(draft), [draft]);
  const activeDensity =
    draft.mode === "default" ? DEFAULT_ADMIN_CUSTOM_THEME.density : draft.custom.density;
  const spacingStyle = ADMIN_SPACING_BY_DENSITY[activeDensity];

  const setMode = useCallback((mode: AdminThemeMode) => {
    setDraft((current) => ({ ...current, mode }));
  }, []);

  const updateCustomTheme = useCallback((patch: AdminCustomThemePatch) => {
    setDraft((current) => ({
      ...current,
      custom: { ...current.custom, ...patch },
    }));
  }, []);

  const save = useCallback(() => {
    persistAdminThemeSettings(storage, draft);
    setSaved(draft);
  }, [draft, storage]);

  const cancel = useCallback(() => {
    setDraft(saved);
  }, [saved]);

  const resetDraft = useCallback(() => {
    setDraft(DEFAULT_ADMIN_THEME_SETTINGS);
  }, []);

  const contextValue = useMemo<AdminThemeContextValue>(
    () => ({
      draft,
      saved,
      hasChanges,
      setMode,
      updateCustomTheme,
      save,
      cancel,
      resetDraft,
    }),
    [cancel, draft, hasChanges, resetDraft, save, saved, setMode, updateCustomTheme],
  );

  return (
    <AdminThemeContext.Provider value={contextValue}>
      <ConfigProvider locale={locale} theme={themeConfig}>
        <AntdApp
          className={`admin-theme-root admin-theme-root--${activeDensity}`}
          style={spacingStyle}
        >
          {children}
        </AntdApp>
      </ConfigProvider>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme(): AdminThemeContextValue {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return context;
}
