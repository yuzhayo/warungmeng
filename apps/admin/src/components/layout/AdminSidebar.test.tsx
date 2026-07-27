import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminSidebar, type AdminSidebarProps } from "./AdminSidebar";

const defaultProps: AdminSidebarProps = {
  collapsed: false,
  mobile: false,
  items: [{ key: "/", label: "Dashboard" }],
  navigationLabel: "Primary navigation",
  selectedKey: "/",
  onBreakpoint: vi.fn(),
  onCollapse: vi.fn(),
  onNavigate: vi.fn(),
};

describe("AdminSidebar", () => {
  it("removes collapsed mobile navigation from the accessibility and keyboard tree", () => {
    const view = render(<AdminSidebar {...defaultProps} collapsed mobile />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    view.rerender(<AdminSidebar {...defaultProps} mobile />);

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("keeps collapsed desktop navigation available", () => {
    render(<AdminSidebar {...defaultProps} collapsed />);

    expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
