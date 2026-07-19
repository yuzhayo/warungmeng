import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBusinessHours } from "./useBusinessHours";

describe("useBusinessHours hook — dirty outlet switch", () => {
  it("selecting another outlet while dirty opens confirmation with correct pending intent", () => {
    const { result } = renderHook(() => useBusinessHours());

    // Select first outlet
    act(() => {
      result.current.selectOutlet("wm-1");
    });
    expect(result.current.state.selectedOutletId).toBe("wm-1");

    // Start editing
    act(() => {
      result.current.startEdit();
    });
    expect(result.current.state.editMode).toBe("editing");
    expect(result.current.state.draft).not.toBeNull();

    // Make a dirty change (close Monday)
    act(() => {
      result.current.updateDayOpen("mon", false);
    });
    expect(result.current.isDirty).toBe(true);

    // Attempt to switch to second outlet while dirty
    act(() => {
      result.current.selectOutlet("wm-2");
    });

    // Should open confirmation, not switch immediately
    expect(result.current.state.confirmOpen).toBe(true);
    expect(result.current.state.dirtyIntent).toBe("outlet");
    expect(result.current.state.pendingOutletSwitch).toEqual({ outletId: "wm-2" });
    // Draft is preserved
    expect(result.current.state.draft).not.toBeNull();
    // Still on first outlet in editing mode
    expect(result.current.state.selectedOutletId).toBe("wm-1");

    // Discard changes — should switch to second outlet
    act(() => {
      result.current.confirmDiscard();
    });
    expect(result.current.state.confirmOpen).toBe(false);
    expect(result.current.state.selectedOutletId).toBe("wm-2");
    expect(result.current.state.editMode).toBe("readonly");
    expect(result.current.state.draft).toBeNull();
  });

  it("keeping editing preserves current outlet and draft", () => {
    const { result } = renderHook(() => useBusinessHours());

    act(() => {
      result.current.selectOutlet("wm-1");
    });
    act(() => {
      result.current.startEdit();
    });
    act(() => {
      result.current.updateDayOpen("mon", false);
    });

    act(() => {
      result.current.selectOutlet("wm-2");
    });
    expect(result.current.state.confirmOpen).toBe(true);

    // Keep editing
    act(() => {
      result.current.confirmKeepEditing();
    });
    expect(result.current.state.confirmOpen).toBe(false);
    expect(result.current.state.selectedOutletId).toBe("wm-1");
    expect(result.current.state.editMode).toBe("editing");
    expect(result.current.isDirty).toBe(true);
    expect(result.current.state.pendingOutletSwitch).toBeNull();
  });
});
