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
});
