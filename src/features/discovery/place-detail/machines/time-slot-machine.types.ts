export type SelectionMode = "any" | "court";
export type ViewMode = "week" | "day";

export type CourtMemoryValue = {
  startTime: string;
  durationMinutes: number;
};

export type AvailableSport = {
  id: string;
  name: string;
};

export type AvailableCourt = {
  id: string;
  label: string;
  sportId: string;
  isActive: boolean;
};

export type TimeSlotContext = {
  placeId: string;
  placeTimeZone: string;
  sportId: string | null;
  date: string | null;
  durationMinutes: number;
  defaultDurationMinutes: number;
  mode: SelectionMode;
  courtId: string | null;
  viewMode: ViewMode;
  startTime: string | null;
  addonIds: string[];
  courtMemory: Record<string, CourtMemoryValue>;
  lastAddedSnapshot: { startTime: string; durationMinutes: number } | null;
  availableSports: AvailableSport[];
  availableCourts: AvailableCourt[];
};

export type TimeSlotInput = {
  placeId: string;
  placeTimeZone: string;
  defaultDurationMinutes: number;
  availableSports: AvailableSport[];
  availableCourts: AvailableCourt[];
  persisted?: {
    placeId?: string | null;
    date?: string | null;
    duration?: number | null;
    sportId?: string | null;
    mode?: SelectionMode | null;
    courtId?: string | null;
    startTime?: string | null;
  };
};

export type TimeSlotEvent =
  | { type: "SELECT_SPORT"; sportId: string }
  | { type: "SELECT_COURT"; courtId: string }
  | { type: "CLEAR_COURT" }
  | { type: "SET_MODE_ANY" }
  | { type: "SET_MODE_COURT" }
  | { type: "SELECT_DATE"; date: string }
  | { type: "GO_TO_TODAY"; todayDayKey: string }
  | { type: "SET_VIEW_WEEK" }
  | { type: "SET_VIEW_DAY" }
  | {
      type: "COMMIT_RANGE";
      startTime: string;
      durationMinutes: number;
      courtMemoryKey?: string | null;
    }
  | { type: "CLEAR_SELECTION"; resetDuration?: boolean }
  | { type: "SLOT_EXPIRED" }
  | { type: "CART_ITEM_ADDED"; courtMemoryKey?: string | null }
  | { type: "SAVE_SNAPSHOT" }
  | { type: "RESTORE_SNAPSHOT" }
  | { type: "SET_ADDONS"; addonIds: string[] }
  | { type: "SET_DURATION"; durationMinutes: number }
  | {
      type: "SYNC_AVAILABLE_COURTS";
      availableCourts: AvailableCourt[];
    }
  | {
      type: "SYNC_AVAILABLE_SPORTS";
      availableSports: AvailableSport[];
    };
