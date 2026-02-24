import { assign, setup } from "xstate";
import {
  buildMemoryKey,
  computeCartItemAdded,
  computeClearSelection,
  computeCommitRange,
  computeCourtSwitch,
  computeDateSelection,
  computeGoToToday,
  computeModeAny,
  computeModeCourt,
  computeSaveSnapshot,
  computeSportSelection,
  computeViewChange,
} from "./time-slot-machine.actions";
import { hasCourtMemory, hasSnapshot } from "./time-slot-machine.guards";
import type {
  TimeSlotContext,
  TimeSlotEvent,
  TimeSlotInput,
} from "./time-slot-machine.types";

export const timeSlotMachine = setup({
  types: {
    context: {} as TimeSlotContext,
    events: {} as TimeSlotEvent,
    input: {} as TimeSlotInput,
  },
  guards: {
    hasCourtMemory: ({ context, event }) => hasCourtMemory({ context, event }),
    hasSnapshot: ({ context, event }) => hasSnapshot({ context, event }),
  },
  actions: {
    assignSport: assign(({ event }) => ({
      sportId: event.type === "SELECT_SPORT" ? event.sportId : null,
      ...computeSportSelection(),
    })),

    assignModeAny: assign(() => computeModeAny()),

    assignModeCourt: assign(({ context }) =>
      computeModeCourt(context.defaultDurationMinutes),
    ),

    assignCourtSwitch: assign(({ context, event }) => {
      if (event.type !== "SELECT_COURT") return {};
      return computeCourtSwitch(context, event.courtId);
    }),

    assignDate: assign(({ event }) => ({
      date: event.type === "SELECT_DATE" ? event.date : null,
      ...computeDateSelection(),
    })),

    assignGoToToday: assign(({ context, event }) => ({
      date: event.type === "GO_TO_TODAY" ? event.todayDayKey : null,
      ...computeGoToToday(context.defaultDurationMinutes),
    })),

    assignViewWeek: assign(() => ({
      viewMode: "week" as const,
      ...computeViewChange(),
    })),

    assignViewDay: assign(() => ({
      viewMode: "day" as const,
      ...computeViewChange(),
    })),

    assignCommitRange: assign(({ context, event }) => {
      if (event.type !== "COMMIT_RANGE") return {};
      return computeCommitRange(
        context.courtMemory,
        event.startTime,
        event.durationMinutes,
        event.courtMemoryKey,
      );
    }),

    assignClearSelection: assign(({ context, event }) =>
      computeClearSelection(
        context.durationMinutes,
        context.defaultDurationMinutes,
        event.type === "CLEAR_SELECTION"
          ? (event.resetDuration ?? false)
          : false,
      ),
    ),

    assignSlotExpired: assign(({ context }) => ({
      startTime: null,
      durationMinutes: context.defaultDurationMinutes,
    })),

    assignCartItemAdded: assign(({ context, event }) => {
      if (event.type !== "CART_ITEM_ADDED") return {};
      return computeCartItemAdded(context.courtMemory, event.courtMemoryKey);
    }),

    assignSaveSnapshot: assign(({ context }) => ({
      lastAddedSnapshot: computeSaveSnapshot(
        context.startTime,
        context.durationMinutes,
        context.lastAddedSnapshot,
      ),
    })),

    assignRestoreSnapshot: assign(({ context }) => ({
      startTime: context.lastAddedSnapshot?.startTime ?? null,
      durationMinutes:
        context.lastAddedSnapshot?.durationMinutes ?? context.durationMinutes,
    })),

    assignAddons: assign(({ event }) => ({
      addonIds: event.type === "SET_ADDONS" ? event.addonIds : [],
    })),

    assignDuration: assign(({ event }) => ({
      durationMinutes:
        event.type === "SET_DURATION" ? event.durationMinutes : 60,
    })),

    assignSyncCourts: assign(({ event }) => ({
      availableCourts:
        event.type === "SYNC_AVAILABLE_COURTS" ? event.availableCourts : [],
    })),

    assignSyncSports: assign(({ event }) => ({
      availableSports:
        event.type === "SYNC_AVAILABLE_SPORTS" ? event.availableSports : [],
    })),

    assignClearCourt: assign(() => ({
      courtId: null,
      startTime: null,
      mode: "any" as const,
    })),
  },
}).createMachine({
  id: "timeSlot",
  context: ({ input }) => {
    const persisted = input.persisted;
    const isPersistedForSamePlace =
      persisted?.placeId != null && persisted.placeId === input.placeId;

    return {
      placeId: input.placeId,
      placeTimeZone: input.placeTimeZone,
      sportId: isPersistedForSamePlace ? (persisted?.sportId ?? null) : null,
      date: isPersistedForSamePlace ? (persisted?.date ?? null) : null,
      durationMinutes:
        isPersistedForSamePlace &&
        typeof persisted?.duration === "number" &&
        persisted.duration > 0
          ? persisted.duration
          : input.defaultDurationMinutes,
      defaultDurationMinutes: input.defaultDurationMinutes,
      mode: isPersistedForSamePlace ? (persisted?.mode ?? "court") : "court",
      courtId: isPersistedForSamePlace ? (persisted?.courtId ?? null) : null,
      viewMode: "week" as const,
      startTime: isPersistedForSamePlace
        ? (persisted?.startTime ?? null)
        : null,
      addonIds: [] as string[],
      courtMemory: {} as Record<
        string,
        { startTime: string; durationMinutes: number }
      >,
      lastAddedSnapshot: null as {
        startTime: string;
        durationMinutes: number;
      } | null,
      availableSports: input.availableSports,
      availableCourts: input.availableCourts,
    };
  },
  on: {
    SELECT_SPORT: { actions: "assignSport" },
    SET_MODE_ANY: { actions: "assignModeAny" },
    SET_MODE_COURT: { actions: "assignModeCourt" },
    SELECT_COURT: [
      {
        guard: "hasCourtMemory",
        actions: "assignCourtSwitch",
      },
      {
        actions: "assignCourtSwitch",
      },
    ],
    CLEAR_COURT: { actions: "assignClearCourt" },
    SELECT_DATE: { actions: "assignDate" },
    GO_TO_TODAY: { actions: "assignGoToToday" },
    SET_VIEW_WEEK: { actions: "assignViewWeek" },
    SET_VIEW_DAY: { actions: "assignViewDay" },
    COMMIT_RANGE: { actions: "assignCommitRange" },
    CLEAR_SELECTION: { actions: "assignClearSelection" },
    SLOT_EXPIRED: { actions: "assignSlotExpired" },
    CART_ITEM_ADDED: { actions: "assignCartItemAdded" },
    SAVE_SNAPSHOT: { actions: "assignSaveSnapshot" },
    RESTORE_SNAPSHOT: {
      guard: "hasSnapshot",
      actions: "assignRestoreSnapshot",
    },
    SET_ADDONS: { actions: "assignAddons" },
    SET_DURATION: { actions: "assignDuration" },
    SYNC_AVAILABLE_COURTS: { actions: "assignSyncCourts" },
    SYNC_AVAILABLE_SPORTS: { actions: "assignSyncSports" },
  },
});

export type { TimeSlotContext, TimeSlotEvent, TimeSlotInput };
export { buildMemoryKey };
