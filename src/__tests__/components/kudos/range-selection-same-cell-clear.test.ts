import { describe, expect, it, vi } from "vitest";
import { createRangeSelectionStore } from "@/components/kudos/range-selection/range-selection-store";
import type { RangeSelectionConfig } from "@/components/kudos/range-selection/types";

function makeConfig(
  overrides?: Partial<RangeSelectionConfig>,
): RangeSelectionConfig {
  return {
    isCellAvailable: () => true,
    computeRange: (a, b) => ({
      startIdx: Math.min(a, b),
      endIdx: Math.max(a, b),
    }),
    clampToContiguous: (_a, b) => b,
    commitRange: vi.fn(),
    ...overrides,
  };
}

describe("range-selection same-cell clear", () => {
  it("does not extend from an externally synced single-cell selection", () => {
    const onClear = vi.fn();
    const config = makeConfig({ onClear });
    const store = createRangeSelectionStore(config);

    // Simulate external sync (e.g., restored selection from machine/props).
    store.getState().setCommittedRange({ startIdx: 3, endIdx: 3 });

    // First user tap on a different cell should start a new anchor, not extend 3->7.
    store.getState().click(7, false);

    expect(store.getState().committedRange).toEqual({
      startIdx: 7,
      endIdx: 7,
    });
    expect(onClear).not.toHaveBeenCalled();
  });

  it("keeps two-click extension for user-created single-cell anchors", () => {
    const config = makeConfig();
    const store = createRangeSelectionStore(config);

    // User tap #1 creates a single-cell anchor.
    store.getState().click(3, false);
    expect(store.getState().committedRange).toEqual({
      startIdx: 3,
      endIdx: 3,
    });

    // User tap #2 extends from that anchor.
    store.getState().click(7, false);
    expect(store.getState().committedRange).toEqual({
      startIdx: 3,
      endIdx: 7,
    });
  });

  it("clears committed single-cell range when same cell is clicked again", () => {
    const onClear = vi.fn();
    const commitRange = vi.fn();
    const config = makeConfig({ onClear, commitRange });
    const store = createRangeSelectionStore(config);

    // Simulate committing a single-cell range at index 5
    store.setState({ committedRange: { startIdx: 5, endIdx: 5 } });
    expect(store.getState().committedRange).toEqual({
      startIdx: 5,
      endIdx: 5,
    });

    // Click the same cell (index 5)
    store.getState().click(5, false);

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(store.getState().committedRange).toBeNull();
  });

  it("does not clear when onClear is not provided", () => {
    const commitRange = vi.fn();
    const config = makeConfig({ commitRange, onClear: undefined });
    const store = createRangeSelectionStore(config);

    // Commit single-cell range at index 3
    store.setState({ committedRange: { startIdx: 3, endIdx: 3 } });

    // Click the same cell — should NOT clear (onClear not provided)
    store.getState().click(3, false);

    // Should extend/re-commit rather than clear
    expect(store.getState().committedRange).not.toBeNull();
  });

  it("does not clear when clicking a different cell", () => {
    const onClear = vi.fn();
    const config = makeConfig({ onClear });
    const store = createRangeSelectionStore(config);

    store.setState({ committedRange: { startIdx: 5, endIdx: 5 } });

    // Click a different cell (index 7)
    store.getState().click(7, false);

    expect(onClear).not.toHaveBeenCalled();
  });

  it("does not clear a multi-cell range when clicking the start cell", () => {
    const onClear = vi.fn();
    const config = makeConfig({ onClear });
    const store = createRangeSelectionStore(config);

    // Multi-cell range (5-8)
    store.setState({ committedRange: { startIdx: 5, endIdx: 8 } });

    // Click start cell — should not clear (range is multi-cell)
    store.getState().click(5, false);

    expect(onClear).not.toHaveBeenCalled();
  });
});
