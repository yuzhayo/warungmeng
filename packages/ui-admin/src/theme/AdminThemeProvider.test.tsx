import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AdminThemeProvider, useAdminTheme } from "./AdminThemeProvider";
import { ADMIN_THEME_STORAGE_KEY } from "./themeStorage";

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

function ThemeHarness() {
  const { draft, saved, hasChanges, cancel, save, setMode, updateCustomTheme } = useAdminTheme();

  return (
    <>
      <output data-testid="draft">{`${draft.mode}:${draft.custom.fontSize}`}</output>
      <output data-testid="saved">{`${saved.mode}:${saved.custom.fontSize}`}</output>
      <output data-testid="dirty">{String(hasChanges)}</output>
      <button onClick={() => setMode("custom")} type="button">
        custom
      </button>
      <button onClick={() => updateCustomTheme({ fontSize: 18 })} type="button">
        large
      </button>
      <button onClick={() => updateCustomTheme({ density: "compact" })} type="button">
        compact
      </button>
      <button onClick={save} type="button">
        save
      </button>
      <button onClick={cancel} type="button">
        cancel
      </button>
    </>
  );
}

describe("AdminThemeProvider", () => {
  it("previews draft changes and cancel restores the saved baseline", async () => {
    const user = userEvent.setup();
    render(
      <AdminThemeProvider storage={null}>
        <ThemeHarness />
      </AdminThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "custom" }));
    await user.click(screen.getByRole("button", { name: "large" }));

    expect(screen.getByTestId("draft").textContent).toBe("custom:18");
    expect(screen.getByTestId("saved").textContent).toBe("default:16");
    expect(screen.getByTestId("dirty").textContent).toBe("true");

    await user.click(screen.getByRole("button", { name: "cancel" }));

    expect(screen.getByTestId("draft").textContent).toBe("default:16");
    expect(screen.getByTestId("dirty").textContent).toBe("false");
  });

  it("save commits the draft and persists it for the next provider", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const firstRender = render(
      <AdminThemeProvider storage={storage}>
        <ThemeHarness />
      </AdminThemeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "custom" }));
    await user.click(screen.getByRole("button", { name: "large" }));
    await user.click(screen.getByRole("button", { name: "save" }));

    expect(screen.getByTestId("saved").textContent).toBe("custom:18");
    expect(screen.getByTestId("dirty").textContent).toBe("false");
    expect(storage.getItem(ADMIN_THEME_STORAGE_KEY)).not.toBeNull();

    firstRender.unmount();
    render(
      <AdminThemeProvider storage={storage}>
        <ThemeHarness />
      </AdminThemeProvider>,
    );

    expect(screen.getByTestId("draft").textContent).toBe("custom:18");
  });

  it("publishes app spacing variables for the active density", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AdminThemeProvider storage={null}>
        <ThemeHarness />
      </AdminThemeProvider>,
    );
    const themeRoot = container.querySelector<HTMLElement>(".admin-theme-root");

    expect(themeRoot?.classList.contains("admin-theme-root--normal")).toBe(true);
    expect(themeRoot?.style.getPropertyValue("--wm-space-md")).toBe("1rem");

    await user.click(screen.getByRole("button", { name: "custom" }));
    await user.click(screen.getByRole("button", { name: "compact" }));

    expect(themeRoot?.classList.contains("admin-theme-root--compact")).toBe(true);
    expect(themeRoot?.style.getPropertyValue("--wm-space-md")).toBe("0.75rem");
  });
});
