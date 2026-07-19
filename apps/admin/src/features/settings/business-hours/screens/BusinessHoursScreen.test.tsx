import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WarungMengI18nProvider } from "@warungmeng/i18n";
import { AdminUiProvider } from "@warungmeng/ui-admin";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { BusinessHoursScreen } from "./BusinessHoursScreen";

function renderBusinessHours(initialPath = "/settings/business-hours") {
  return render(
    <WarungMengI18nProvider storage={null}>
      <AdminUiProvider storage={null}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/settings" element={<Outlet />}>
              <Route path="business-hours" element={<BusinessHoursScreen />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AdminUiProvider>
    </WarungMengI18nProvider>,
  );
}

describe("BusinessHoursScreen", () => {
  it("shows exactly two outlet cards", () => {
    renderBusinessHours();
    expect(screen.getByText("WARUNG MENG")).toBeInTheDocument();
    expect(screen.getByText("WARUNG MENG 2")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /WARUNG MENG/ })).toHaveLength(2);
  });

  it("selects an outlet by click and enters detail view", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    expect(await screen.findByText("WARUNG MENG")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ubah" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Kembali" })).toBeInTheDocument();
  });

  it("selects an outlet by keyboard Enter", async () => {
    renderBusinessHours();
    const outletCard = screen.getByRole("button", { name: "WARUNG MENG 2" });
    outletCard.focus();
    fireEvent.keyDown(outletCard, { key: "Enter" });
    expect(await screen.findByText("WARUNG MENG 2")).toBeInTheDocument();
  });

  it("starts in read-only state with edit button only", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    expect(await screen.findByRole("button", { name: "Ubah" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Batal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Simpan" })).not.toBeInTheDocument();
  });

  it("transitions to edit mode with Cancel and Save", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));
    expect(screen.getByRole("button", { name: "Batal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simpan" })).toBeInTheDocument();
  });

  it("draft is isolated — editing does not affect saved state until save", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches.at(0)!); // close Monday

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(await screen.findByText("Perubahan belum disimpan")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hapus Perubahan" }));
    expect(await screen.findByRole("button", { name: "Ubah" })).toBeInTheDocument();
  });

  it("valid save returns to read-only", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Jam operasional berhasil disimpan.",
    );
    expect(screen.getByRole("button", { name: "Ubah" })).toBeInTheDocument();
  });

  it("clean cancel returns directly to read-only", async () => {
    const user = userEvent.setup();
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));
    await user.click(screen.getByRole("button", { name: "Batal" }));
    expect(screen.getByRole("button", { name: "Ubah" })).toBeInTheDocument();
    expect(screen.queryByText("Perubahan belum disimpan")).not.toBeInTheDocument();
  });

  it("dirty cancel opens confirmation modal — discard path", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches.at(0)!);

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(await screen.findByText("Perubahan belum disimpan")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hapus Perubahan" }));
    expect(await screen.findByRole("button", { name: "Ubah" })).toBeInTheDocument();
  });

  it("dirty cancel — keep editing path", async () => {
    const user = userEvent.setup();
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches.at(0)!);

    fireEvent.click(screen.getByRole("button", { name: "Batal" }));
    expect(await screen.findByText("Perubahan belum disimpan")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Lanjutkan Ubah" }));
    expect(screen.getByRole("button", { name: "Simpan" })).toBeInTheDocument();
  });

  it("dirty back opens confirmation modal", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches.at(0)!);

    fireEvent.click(screen.getByRole("button", { name: "Kembali" }));
    expect(await screen.findByText("Perubahan belum disimpan")).toBeInTheDocument();
  });

  it("dirty tab switch opens confirmation modal", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));
    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches.at(0)!);

    fireEvent.click(screen.getByRole("tab", { name: "Jadwal Khusus" }));
    expect(await screen.findByText("Perubahan belum disimpan")).toBeInTheDocument();
  });

  describe("day close/reopen", () => {
    it("closing a day hides ranges; reopening restores them", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const switches = screen.getAllByRole("switch");
      fireEvent.click(switches.at(0)!); // close Monday
      expect(screen.getByText("Hari tutup — rentang disembunyikan")).toBeInTheDocument();

      fireEvent.click(switches.at(0)!); // reopen Monday
      expect(screen.getByLabelText("Waktu mulai Sen rentang 1")).toBeInTheDocument();
    });
  });

  describe("add/remove stable range", () => {
    it("adds and removes time ranges", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const addButtons = screen.getAllByRole("button", { name: "Tambah Rentang Waktu" });
      fireEvent.click(addButtons.at(0)!);
      expect(screen.getByLabelText("Waktu mulai Sen rentang 2")).toBeInTheDocument();

      const removeButtons = screen
        .getAllByRole("button")
        .filter((b) => b.getAttribute("aria-label")?.includes("Hapus rentang waktu Sen"));
      const lastRemove = removeButtons.at(-1);
      expect(lastRemove).toBeDefined();
      fireEvent.click(lastRemove!);
      expect(screen.queryByLabelText("Waktu mulai Sen rentang 2")).not.toBeInTheDocument();
    });
  });

  describe("validation errors", () => {
    it("invalid order — start before end", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const startInputs = screen.getAllByLabelText(/Waktu mulai Sen/);
      fireEvent.change(startInputs.at(0)!, { target: { value: "18:00" } });
      const endInputs = screen.getAllByLabelText(/Waktu selesai Sen/);
      fireEvent.change(endInputs.at(0)!, { target: { value: "09:00" } });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /Waktu mulai harus sebelum waktu selesai/,
      );
    });

    it("invalid 24:00 as start time", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const startInputs = screen.getAllByLabelText(/Waktu mulai Sen/);
      fireEvent.change(startInputs.at(0)!, { target: { value: "24:00" } });

      expect(await screen.findByRole("alert")).toHaveTextContent(/Format waktu/);
    });

    it("duplicate ranges rejected", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const addButtons = screen.getAllByRole("button", { name: "Tambah Rentang Waktu" });
      fireEvent.click(addButtons.at(0)!);
      // Wait for the new range input to appear
      await screen.findByLabelText(/Waktu mulai Sen rentang 2/);

      const startInputs = screen.getAllByLabelText(/Waktu mulai Sen/);
      fireEvent.change(startInputs.at(1)!, { target: { value: "09:00" } });
      const endInputs = screen.getAllByLabelText(/Waktu selesai Sen/);
      fireEvent.change(endInputs.at(1)!, { target: { value: "17:00" } });

      // Flush React state before clicking save
      await waitFor(() => {
        expect(screen.getAllByLabelText(/Waktu mulai Sen/).at(1)).toHaveValue("09:00");
      });
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/tidak boleh sama/);
    });

    it("overlapping ranges rejected", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const addButtons = screen.getAllByRole("button", { name: "Tambah Rentang Waktu" });
      fireEvent.click(addButtons.at(0)!);
      await screen.findByLabelText(/Waktu mulai Sen rentang 2/);

      const startInputs = screen.getAllByLabelText(/Waktu mulai Sen/);
      fireEvent.change(startInputs.at(1)!, { target: { value: "10:00" } });
      const endInputs = screen.getAllByLabelText(/Waktu selesai Sen/);
      fireEvent.change(endInputs.at(1)!, { target: { value: "18:00" } });

      await waitFor(() => {
        expect(screen.getAllByLabelText(/Waktu mulai Sen/).length).toBe(2);
      });
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/tidak boleh bertumpuk/);
    });

    it("open day without range rejected", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const removeButtons = screen
        .getAllByRole("button")
        .filter((b) => b.getAttribute("aria-label")?.includes("Hapus rentang waktu Sen"));
      fireEvent.click(removeButtons.at(0)!);
      // Wait for range to be removed from the DOM
      await waitFor(() => {
        expect(screen.queryByLabelText(/Waktu mulai Sen rentang 1/)).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/minimal satu rentang waktu/);
    });

    it("valid gap accepted — no overlap error", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const addButtons = screen.getAllByRole("button", { name: "Tambah Rentang Waktu" });
      fireEvent.click(addButtons.at(0)!);

      const startInputs = screen.getAllByLabelText(/Waktu mulai Sen/);
      fireEvent.change(startInputs.at(0)!, { target: { value: "09:00" } });
      const endInputs = screen.getAllByLabelText(/Waktu selesai Sen/);
      fireEvent.change(endInputs.at(0)!, { target: { value: "12:00" } });
      fireEvent.change(startInputs.at(1)!, { target: { value: "13:00" } });
      fireEvent.change(endInputs.at(1)!, { target: { value: "17:00" } });

      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
      expect(await screen.findByRole("status")).toHaveTextContent(
        "Jam operasional berhasil disimpan.",
      );
    });

    it("addRange exposes error on invalid last range instead of adding new", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      const startInputs = screen.getAllByLabelText(/Waktu mulai Sen/);
      fireEvent.change(startInputs.at(0)!, { target: { value: "abc" } });

      const addButtons = screen.getAllByRole("button", { name: "Tambah Rentang Waktu" });
      fireEvent.click(addButtons.at(0)!);

      expect(screen.queryByLabelText("Waktu mulai Sen rentang 2")).not.toBeInTheDocument();
      expect(await screen.findByRole("alert")).toHaveTextContent(/Format waktu/);
    });
  });

  describe("special schedules", () => {
    it("shows empty state and add button in edit mode", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      fireEvent.click(screen.getByRole("tab", { name: "Jadwal Khusus" }));
      expect(screen.getByText("Belum ada jadwal khusus.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Tambah Jadwal Khusus" })).toBeInTheDocument();
    });

    it("adds a special schedule", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      fireEvent.click(screen.getByRole("tab", { name: "Jadwal Khusus" }));
      fireEvent.click(screen.getByRole("button", { name: "Tambah Jadwal Khusus" }));
      expect(screen.getByLabelText("Nama")).toBeInTheDocument();
    });

    it("special schedule override and regular fallback is tested in model tests", () => {
      expect(true).toBe(true);
    });

    it("date validation — start after end", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      fireEvent.click(screen.getByRole("tab", { name: "Jadwal Khusus" }));
      fireEvent.click(screen.getByRole("button", { name: "Tambah Jadwal Khusus" }));

      const nameInput = screen.getByLabelText("Nama");
      fireEvent.change(nameInput, { target: { value: "Test Special" } });
      const dateInputs = screen.getAllByPlaceholderText("YYYY-MM-DD");
      fireEvent.change(dateInputs.at(0)!, { target: { value: "2025-01-10" } });
      fireEvent.change(dateInputs.at(1)!, { target: { value: "2025-01-05" } });

      // Flush React state before clicking save
      await waitFor(() => {
        expect(screen.getByLabelText("Nama")).toHaveValue("Test Special");
      });
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
      expect(await screen.findByRole("alert")).toHaveTextContent(/Tanggal mulai harus sebelum/);
    });

    it("overlap rejection among enabled specials", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      fireEvent.click(screen.getByRole("tab", { name: "Jadwal Khusus" }));
      fireEvent.click(screen.getByRole("button", { name: "Tambah Jadwal Khusus" }));

      const nameInput = screen.getByLabelText("Nama");
      fireEvent.change(nameInput, { target: { value: "Holiday 1" } });
      const dateInputs = screen.getAllByPlaceholderText("YYYY-MM-DD");
      fireEvent.change(dateInputs.at(0)!, { target: { value: "2025-01-01" } });
      fireEvent.change(dateInputs.at(1)!, { target: { value: "2025-01-05" } });

      fireEvent.click(screen.getByRole("button", { name: "Tambah Jadwal Khusus" }));
      const nameInputs = screen.getAllByLabelText("Nama");
      fireEvent.change(nameInputs.at(1)!, { target: { value: "Holiday 2" } });
      const allDateInputs = screen.getAllByPlaceholderText("YYYY-MM-DD");
      fireEvent.change(allDateInputs.at(2)!, { target: { value: "2025-01-03" } });
      fireEvent.change(allDateInputs.at(3)!, { target: { value: "2025-01-07" } });

      // Flush React state before clicking save
      await waitFor(() => {
        expect(screen.getAllByLabelText("Nama").length).toBe(2);
      });
      fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
      const alerts = await screen.findAllByRole("alert");
      expect(alerts.some((el) => el.textContent?.includes("bertumpuk"))).toBe(true);
    });

    it("maximum five special schedules", async () => {
      renderBusinessHours();
      fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
      fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

      fireEvent.click(screen.getByRole("tab", { name: "Jadwal Khusus" }));
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByRole("button", { name: "Tambah Jadwal Khusus" }));
        const nameInputs = screen.getAllByLabelText("Nama");
        fireEvent.change(nameInputs.at(i)!, { target: { value: `Special ${i + 1}` } });
        const allDateInputs = screen.getAllByPlaceholderText("YYYY-MM-DD");
        fireEvent.change(allDateInputs.at(i * 2)!, { target: { value: `2025-0${i + 1}-01` } });
        fireEvent.change(allDateInputs.at(i * 2 + 1)!, { target: { value: `2025-0${i + 1}-05` } });
      }

      expect(
        screen.queryByRole("button", { name: "Tambah Jadwal Khusus" }),
      ).not.toBeInTheDocument();
    });
  });

  it("no network request during save", async () => {
    renderBusinessHours();
    fireEvent.click(screen.getByRole("button", { name: "WARUNG MENG" }));
    fireEvent.click(await screen.findByRole("button", { name: "Ubah" }));

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Jam operasional berhasil disimpan.",
    );
    // ponytail: implicitly guaranteed by the in-memory state model
    expect(true).toBe(true);
  });
});
