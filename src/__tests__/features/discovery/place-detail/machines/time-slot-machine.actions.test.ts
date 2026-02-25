import { describe, expect, it } from "vitest";
import { computeSportSelection } from "@/features/discovery/place-detail/machines/time-slot-machine.actions";

describe("computeSportSelection", () => {
  it("defaults sport selection to court mode and clears active selection", () => {
    expect(computeSportSelection()).toEqual({
      courtId: null,
      startTime: null,
      mode: "court",
      viewMode: "week",
      lastAddedSnapshot: null,
    });
  });
});
