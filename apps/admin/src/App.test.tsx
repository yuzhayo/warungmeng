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
    expect(screen.getByRole("tab", { name: "Jam Operasional" })).toBeInTheDocument();
    expect(screen.getByText("Pilihan Tema")).toBeInTheDocument();
  });

  it("routes Menu through reusable tabs to the variant category list", async () => {
    window.localStorage.clear();
    window.location.hash = "#/menu/variants";
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Pengaturan Menu" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Kategori Varian" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(await screen.findByText("BUMBU 50ml")).toBeInTheDocument();
  });

  it("routes Order Management to the order list inside the admin shell", async () => {
    window.localStorage.clear();
    window.location.hash = "#/orders";
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Manajemen Pesanan" })).toBeInTheDocument();
    expect(await screen.findByText("WM-1008")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navigasi utama" })).toBeInTheDocument();
  });

  it("routes a selected order to its detail screen", async () => {
    window.localStorage.clear();
    window.location.hash = "#/orders/order-1008";
    render(<App />);

    expect(await screen.findByRole("heading", { name: "WM-1008" })).toBeInTheDocument();
    expect(screen.getByText("Ringkasan")).toBeInTheDocument();
    expect(screen.getByText("Riwayat Status")).toBeInTheDocument();
  });
});
