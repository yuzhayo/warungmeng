import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("admin foundation", () => {
  it("renders the initial admin route inside the application providers", () => {
    window.localStorage.clear();
    window.location.hash = "#/";
    render(<App />);

    expect(screen.getByText("WARUNG MENG")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Performa Outlet" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
  });

  it("routes Settings through the reusable settings tabs to the theme screen", async () => {
    window.localStorage.clear();
    window.location.hash = "#/settings";
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Pengaturan" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tema" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Jam Operasional" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByText("Pilihan Tema")).toBeInTheDocument();
  });
});
