import { createStore } from "zustand/vanilla";
import type { DragPreset } from "../components/booking-studio/types";

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
  mobileBlockType: "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING";
  mobileCommittedRange: { startIdx: number; endIdx: number } | null;
  mobileGuestModeState: "new" | "existing";

  // Mobile refs (stored as plain values)
  mobileGuestMode: "new" | "existing";
  mobileGuestName: string;
  mobileGuestPhone: string;
  mobileGuestEmail: string;
  mobileGuestProfileId: string;
  mobileNotes: string;

  // Drag
  activeDragItem: DragPreset | null;

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
  setMobileBlockType: (
    type: "WALK_IN" | "MAINTENANCE" | "GUEST_BOOKING",
  ) => void;
  setMobileCommittedRange: (
    range: { startIdx: number; endIdx: number } | null,
  ) => void;
  setMobileGuestModeState: (mode: "new" | "existing") => void;
  setMobileGuestMode: (mode: "new" | "existing") => void;
  setMobileGuestName: (name: string) => void;
  setMobileGuestPhone: (phone: string) => void;
  setMobileGuestEmail: (email: string) => void;
  setMobileGuestProfileId: (id: string) => void;
  setMobileNotes: (notes: string) => void;
  setActiveDragItem: (item: DragPreset | null) => void;
  setCalendarMonth: (month: Date) => void;
  setMobileCalendarOpen: (open: boolean) => void;

  // Compound actions
  openGuestBookingDialog: (start: Date, end: Date) => void;
  closeGuestBookingDialog: () => void;
  resetMobileDrawer: () => void;
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
    mobileBlockType: "GUEST_BOOKING",
    mobileCommittedRange: null,
    mobileGuestModeState: "existing",

    // Mobile refs
    mobileGuestMode: "existing",
    mobileGuestName: "",
    mobileGuestPhone: "",
    mobileGuestEmail: "",
    mobileGuestProfileId: "",
    mobileNotes: "",

    // Drag
    activeDragItem: null,

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
    setMobileBlockType: (type) => set({ mobileBlockType: type }),
    setMobileCommittedRange: (range) => set({ mobileCommittedRange: range }),
    setMobileGuestModeState: (mode) => set({ mobileGuestModeState: mode }),
    setMobileGuestMode: (mode) => set({ mobileGuestMode: mode }),
    setMobileGuestName: (name) => set({ mobileGuestName: name }),
    setMobileGuestPhone: (phone) => set({ mobileGuestPhone: phone }),
    setMobileGuestEmail: (email) => set({ mobileGuestEmail: email }),
    setMobileGuestProfileId: (id) => set({ mobileGuestProfileId: id }),
    setMobileNotes: (notes) => set({ mobileNotes: notes }),
    setActiveDragItem: (item) => set({ activeDragItem: item }),
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
    resetMobileDrawer: () =>
      set({
        mobileDrawerOpen: false,
        mobileCommittedRange: null,
        mobileNotes: "",
        mobileGuestName: "",
        mobileGuestPhone: "",
        mobileGuestEmail: "",
        mobileGuestProfileId: "",
        mobileGuestMode: "existing",
        mobileGuestModeState: "existing",
      }),
  }));
