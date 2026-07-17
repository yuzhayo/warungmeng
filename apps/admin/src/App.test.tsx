import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("admin foundation", () => {
  it("renders the initial admin route inside the application providers", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Warung Meng" })).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});
