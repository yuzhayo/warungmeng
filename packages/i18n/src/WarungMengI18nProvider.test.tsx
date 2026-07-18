import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useTranslation } from "react-i18next";
import { formatRupiah } from "./formatters";
import {
  LANGUAGE_STORAGE_KEY,
  REGIONAL_FORMAT_STORAGE_KEY,
  type LocalePreferenceStorage,
} from "./preferences";
import { WarungMengI18nProvider, useLocaleSettings } from "./WarungMengI18nProvider";

function LocaleProbe() {
  const { t } = useTranslation();
  const { language, regionalFormat, setLanguage, setRegionalFormat } = useLocaleSettings();

  return (
    <>
      <span>{t("header.notifications")}</span>
      <output aria-label="language">{language}</output>
      <output aria-label="regional-format">{regionalFormat}</output>
      <output aria-label="formatted-price">{formatRupiah(22_000, { regionalFormat })}</output>
      <button onClick={() => setLanguage("en")} type="button">
        English
      </button>
      <button onClick={() => setRegionalFormat("en-US")} type="button">
        US format
      </button>
    </>
  );
}

function createStorage(): {
  readonly storage: LocalePreferenceStorage;
  readonly values: Map<string, string>;
} {
  const values = new Map<string, string>();
  return {
    values,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
}

describe("WarungMengI18nProvider", () => {
  it("changes UI language without changing regional format", async () => {
    const user = userEvent.setup();
    const { storage, values } = createStorage();
    render(
      <WarungMengI18nProvider storage={storage}>
        <LocaleProbe />
      </WarungMengI18nProvider>,
    );

    expect(screen.getByText("Notifikasi")).toBeInTheDocument();
    expect(screen.getByLabelText("regional-format")).toHaveTextContent("id-ID");
    const initialPrice = screen.getByLabelText("formatted-price").textContent?.replace(/\s/g, " ");

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(await screen.findByText("Notifications")).toBeInTheDocument();
    expect(screen.getByLabelText("language")).toHaveTextContent("en");
    expect(screen.getByLabelText("regional-format")).toHaveTextContent("id-ID");
    expect(screen.getByLabelText("formatted-price").textContent?.replace(/\s/g, " ")).toBe(
      initialPrice,
    );
    expect(screen.getByLabelText("formatted-price")).toHaveTextContent("22.000");
    expect(values.get(LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(values.has(REGIONAL_FORMAT_STORAGE_KEY)).toBe(false);
    expect(document.documentElement.lang).toBe("en");
  });

  it("changes regional format without changing UI language", async () => {
    const user = userEvent.setup();
    const { storage, values } = createStorage();
    render(
      <WarungMengI18nProvider storage={storage}>
        <LocaleProbe />
      </WarungMengI18nProvider>,
    );

    await user.click(screen.getByRole("button", { name: "US format" }));

    expect(screen.getByLabelText("language")).toHaveTextContent("id");
    expect(screen.getByLabelText("regional-format")).toHaveTextContent("en-US");
    expect(screen.getByText("Notifikasi")).toBeInTheDocument();
    expect(values.get(REGIONAL_FORMAT_STORAGE_KEY)).toBe("en-US");
    expect(values.has(LANGUAGE_STORAGE_KEY)).toBe(false);
  });
});
