import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useModGetStartedOverlays } from "@/features/owner/components/get-started/get-started-hooks";

describe("useModGetStartedOverlays", () => {
  it("starts with null activeOverlay", () => {
    const { result } = renderHook(() => useModGetStartedOverlays());

    expect(result.current.activeOverlay).toBeNull();
  });

  it("sets activeOverlay on openOverlay", () => {
    const { result } = renderHook(() => useModGetStartedOverlays());

    act(() => {
      result.current.openOverlay("venue");
    });

    expect(result.current.activeOverlay).toBe("venue");
  });

  it("resets activeOverlay on closeOverlay", () => {
    const { result } = renderHook(() => useModGetStartedOverlays());

    act(() => {
      result.current.openOverlay("courts");
    });
    expect(result.current.activeOverlay).toBe("courts");

    act(() => {
      result.current.closeOverlay();
    });
    expect(result.current.activeOverlay).toBeNull();
  });

  it("enforces single overlay at a time by replacing", () => {
    const { result } = renderHook(() => useModGetStartedOverlays());

    act(() => {
      result.current.openOverlay("org");
    });
    expect(result.current.activeOverlay).toBe("org");

    act(() => {
      result.current.openOverlay("verify");
    });
    expect(result.current.activeOverlay).toBe("verify");
  });

  it("supports all overlay step types", () => {
    const { result } = renderHook(() => useModGetStartedOverlays());
    const steps = ["org", "venue", "claim", "courts", "verify", "import"] as const;

    for (const step of steps) {
      act(() => {
        result.current.openOverlay(step);
      });
      expect(result.current.activeOverlay).toBe(step);
    }
  });
});
