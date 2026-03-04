import { describe, expect, it } from "vitest";
import {
  computeDateSelection,
  computeSportSelection,
} from "@/features/discovery/place-detail/machines/time-slot-machine.actions";

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

describe("computeDateSelection", () => {
  it("keeps start time when preserveSelection is true", () => {
    expect(computeDateSelection(true)).toEqual({
      lastAddedSnapshot: null,
    });
  });

  it("clears start time when preserveSelection is false", () => {
    expect(computeDateSelection(false)).toEqual({
      startTime: null,
      lastAddedSnapshot: null,
    });
  });
});
