import { createStore } from "zustand/vanilla";

export interface BookingStudioState {
  // Dialog state
  guestBookingOpen: boolean;
  guestBookingTimes: { start: Date; end: Date } | null;
  customDialogOpen: boolean;
  pendingRemoveBlockId: string | null;

  // Guest search (desktop dialog)
  guestSearch: string;
  debouncedGuestSearch: string;
  guestComboboxOpen: boolean;

  // Mobile drawer
  mobileDrawerOpen: boolean;

  // Selection panel (shared between mobile drawer & desktop sidebar)
  selectionBlockType: "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING";
  committedRange: { startIdx: number; endIdx: number } | null;
  guestModeState: "new" | "existing";

  // Selection panel refs (stored as plain values)
  guestMode: "new" | "existing";
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestProfileId: string;
  notes: string;

  // Calendar
  calendarMonth: Date;
  mobileCalendarOpen: boolean;

  // Actions
  setGuestBookingOpen: (open: boolean) => void;
  setGuestBookingTimes: (times: { start: Date; end: Date } | null) => void;
  setCustomDialogOpen: (open: boolean) => void;
  setPendingRemoveBlockId: (id: string | null) => void;
  setGuestSearch: (search: string) => void;
  setDebouncedGuestSearch: (search: string) => void;
  setGuestComboboxOpen: (open: boolean) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setSelectionBlockType: (
    type: "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING",
  ) => void;
  setCommittedRange: (
    range: { startIdx: number; endIdx: number } | null,
  ) => void;
  setGuestModeState: (mode: "new" | "existing") => void;
  setGuestMode: (mode: "new" | "existing") => void;
  setGuestName: (name: string) => void;
  setGuestPhone: (phone: string) => void;
  setGuestEmail: (email: string) => void;
  setGuestProfileId: (id: string) => void;
  setNotes: (notes: string) => void;
  setCalendarMonth: (month: Date) => void;
  setMobileCalendarOpen: (open: boolean) => void;

  // Compound actions
  openGuestBookingDialog: (start: Date, end: Date) => void;
  closeGuestBookingDialog: () => void;
  resetSelectionPanel: () => void;
}

export type BookingStudioStoreApi = ReturnType<typeof createBookingStudioStore>;

export const createBookingStudioStore = (initialDate: Date) =>
  createStore<BookingStudioState>()((set) => ({
    // Dialog state
    guestBookingOpen: false,
    guestBookingTimes: null,
    customDialogOpen: false,
    pendingRemoveBlockId: null,

    // Guest search
    guestSearch: "",
    debouncedGuestSearch: "",
    guestComboboxOpen: false,

    // Mobile drawer
    mobileDrawerOpen: false,

    // Selection panel
    selectionBlockType: "GUEST_BOOKING",
    committedRange: null,
    guestModeState: "existing",

    // Selection panel refs
    guestMode: "existing",
    guestName: "",
    guestPhone: "",
    guestEmail: "",
    guestProfileId: "",
    notes: "",

    // Calendar
    calendarMonth: initialDate,
    mobileCalendarOpen: false,

    // Actions
    setGuestBookingOpen: (open) => set({ guestBookingOpen: open }),
    setGuestBookingTimes: (times) => set({ guestBookingTimes: times }),
    setCustomDialogOpen: (open) => set({ customDialogOpen: open }),
    setPendingRemoveBlockId: (id) => set({ pendingRemoveBlockId: id }),
    setGuestSearch: (search) => set({ guestSearch: search }),
    setDebouncedGuestSearch: (search) => set({ debouncedGuestSearch: search }),
    setGuestComboboxOpen: (open) => set({ guestComboboxOpen: open }),
    setMobileDrawerOpen: (open) => set({ mobileDrawerOpen: open }),
    setSelectionBlockType: (type) => set({ selectionBlockType: type }),
    setCommittedRange: (range) => set({ committedRange: range }),
    setGuestModeState: (mode) => set({ guestModeState: mode }),
    setGuestMode: (mode) => set({ guestMode: mode }),
    setGuestName: (name) => set({ guestName: name }),
    setGuestPhone: (phone) => set({ guestPhone: phone }),
    setGuestEmail: (email) => set({ guestEmail: email }),
    setGuestProfileId: (id) => set({ guestProfileId: id }),
    setNotes: (notes) => set({ notes: notes }),
    setCalendarMonth: (month) => set({ calendarMonth: month }),
    setMobileCalendarOpen: (open) => set({ mobileCalendarOpen: open }),

    // Compound actions
    openGuestBookingDialog: (start, end) =>
      set({
        guestBookingTimes: { start, end },
        guestBookingOpen: true,
      }),
    closeGuestBookingDialog: () =>
      set({
        guestBookingOpen: false,
        guestBookingTimes: null,
      }),
    resetSelectionPanel: () =>
      set({
        mobileDrawerOpen: false,
        committedRange: null,
        notes: "",
        guestName: "",
        guestPhone: "",
        guestEmail: "",
        guestProfileId: "",
        guestMode: "existing",
        guestModeState: "existing",
      }),
  }));
