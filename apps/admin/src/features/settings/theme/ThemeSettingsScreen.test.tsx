import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { describe, expect, it } from "vitest";
import { ThemeSettingsScreen } from "./ThemeSettingsScreen";

function renderThemeSettings() {
  return render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <ThemeSettingsScreen />
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );
}

describe("ThemeSettingsScreen", () => {
  it("starts in the built-in mode with custom controls disabled", () => {
    renderThemeSettings();

    expect(screen.getByText("Pilihan Tema")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Bawaan" })).toBeChecked();
    expect(screen.getByRole("spinbutton", { name: "Bentuk Sudut" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "14 px" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Otomatis" })).toBeDisabled();
    expect(screen.getByLabelText("Pilihan warna teks")).toHaveClass(
      "ant-color-picker-trigger-disabled",
    );
    expect(screen.getByText("Keterbacaan Warna")).toBeInTheDocument();
    expect(
      screen.getByText("Area preview dashboard disiapkan untuk pengembangan berikutnya."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled();
  });

  it("previews the customized mode, supports cancel, and commits with save", async () => {
    const user = userEvent.setup();
    renderThemeSettings();

    fireEvent.click(screen.getByRole("radio", { name: "Sesuaikan" }));

    expect(screen.getByRole("spinbutton", { name: "Bentuk Sudut" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "14 px" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Otomatis" })).toBeEnabled();
    expect(screen.getByLabelText("Pilihan warna teks")).toHaveClass(
      "ant-color-picker-trigger-disabled",
    );
    expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled();

    fireEvent.click(screen.getByRole("radio", { name: "Manual" }));
    expect(screen.getByLabelText("Pilihan warna teks")).not.toHaveClass(
      "ant-color-picker-trigger-disabled",
    );

    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.getByRole("radio", { name: "Bawaan" })).toBeChecked();

    fireEvent.click(screen.getByRole("radio", { name: "Sesuaikan" }));
    await user.click(screen.getByRole("button", { name: "Simpan" }));

    expect(screen.getByRole("status")).toHaveTextContent("Tema berhasil disimpan.");
    expect(screen.getByRole("button", { name: "Simpan" })).toBeDisabled();
  });
});
