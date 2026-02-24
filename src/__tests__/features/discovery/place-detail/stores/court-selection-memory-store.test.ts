import { beforeEach, describe, expect, it } from "vitest";
import { useCourtSelectionMemoryStore } from "@/features/discovery/place-detail/stores/court-selection-memory-store";

describe("useCourtSelectionMemoryStore", () => {
  beforeEach(() => {
    useCourtSelectionMemoryStore.getState().clearAll();
  });

  it("stores and retrieves a selection by key", () => {
    const store = useCourtSelectionMemoryStore.getState();

    store.rememberSelection("place-1|sport-1|2026-02-24|court-a", {
      startTime: "2026-02-24T01:00:00.000Z",
      durationMinutes: 120,
    });

    expect(store.getSelection("place-1|sport-1|2026-02-24|court-a")).toEqual({
      startTime: "2026-02-24T01:00:00.000Z",
      durationMinutes: 120,
    });
  });

  it("clears only the targeted key", () => {
    const store = useCourtSelectionMemoryStore.getState();
    store.rememberSelection("key-a", {
      startTime: "2026-02-24T01:00:00.000Z",
      durationMinutes: 60,
    });
    store.rememberSelection("key-b", {
      startTime: "2026-02-24T02:00:00.000Z",
      durationMinutes: 120,
    });

    store.clearSelection("key-a");

    expect(store.getSelection("key-a")).toBeUndefined();
    expect(store.getSelection("key-b")).toEqual({
      startTime: "2026-02-24T02:00:00.000Z",
      durationMinutes: 120,
    });
  });

  it("clears all selections", () => {
    const store = useCourtSelectionMemoryStore.getState();
    store.rememberSelection("key-a", {
      startTime: "2026-02-24T01:00:00.000Z",
      durationMinutes: 60,
    });

    store.clearAll();

    expect(store.getSelection("key-a")).toBeUndefined();
  });
});
