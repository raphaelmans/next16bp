import { TZDate } from "@date-fns/tz";
import { addMinutes, format } from "date-fns";
import { z } from "zod";
import {
  getZonedDate,
  getZonedDayKey,
  getZonedDayRangeFromDayKey,
} from "@/shared/lib/time-zone";

export const DEFAULT_START_HOUR = 6;
export const DEFAULT_END_HOUR = 22;
export const TIMELINE_ROW_HEIGHT = 56;

export const generateOptimisticId = () =>
  `optimistic:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;

export const isOptimisticBlockId = (blockId: string) =>
  blockId.startsWith("optimistic:");

export const studioViewSchema = ["day", "week"] as const;
export type StudioView = (typeof studioViewSchema)[number];

export type BlockPreset = {
  id: string;
  label: string;
  blockType: "MAINTENANCE" | "WALK_IN" | "GUEST_BOOKING";
  durationMinutes: number;
  badgeVariant: "warning" | "paid" | "default";
  description: string;
};

export type DragPreset = {
  kind: "preset";
  preset: BlockPreset;
};

export type DragBlock = {
  kind: "block";
  blockId: string;
};

export type DragResizeHandle = {
  kind: "resize";
  blockId: string;
  edge: "start" | "end";
};

export type DragDraftRow = {
  kind: "draft-row";
  rowId: string;
};

export type DragItem = DragPreset | DragBlock | DragResizeHandle | DragDraftRow;

export type TimelineCellData = {
  kind: "timeline-cell";
  dayKey: string;
  startMinute: number;
};

export type DraftRowStatus =
  | "VALID"
  | "ERROR"
  | "WARNING"
  | "PENDING"
  | "COMMITTED"
  | "SKIPPED";

export type CourtBlockItem = {
  id: string;
  courtId: string;
  type: "MAINTENANCE" | "WALK_IN";
  startTime: string;
  endTime: string;
  reason: string | null;
  totalPriceCents: number;
  currency: string;
  isActive: boolean;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReservationItem = {
  id: string;
  courtId: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPriceCents: number;
  currency: string;
  playerNameSnapshot: string | null;
  guestProfileId: string | null;
  playerId: string | null;
};

export type DraftRowItem = {
  id: string;
  lineNumber: number;
  status: DraftRowStatus;
  courtId: string | null;
  courtLabel: string | null;
  startTime: Date | string | null;
  endTime: Date | string | null;
  reason: string | null;
  errors: string[] | null;
  warnings: string[] | null;
};

export const BLOCK_PRESETS: BlockPreset[] = [
  {
    id: "preset-walkin-60",
    label: "1h Walk-in",
    blockType: "WALK_IN",
    durationMinutes: 60,
    badgeVariant: "paid",
    description: "Reserve for walk-in customers.",
  },
  {
    id: "preset-maintenance-60",
    label: "1h Maintenance",
    blockType: "MAINTENANCE",
    durationMinutes: 60,
    badgeVariant: "warning",
    description: "Block for repairs or private events.",
  },
  {
    id: "preset-guest-60",
    label: "1h Guest booking",
    blockType: "GUEST_BOOKING",
    durationMinutes: 60,
    badgeVariant: "default",
    description: "Create a confirmed reservation for a guest.",
  },
];

export const DRAFT_STATUS_PRIORITY: Record<DraftRowStatus, number> = {
  ERROR: 0,
  WARNING: 1,
  VALID: 2,
  PENDING: 3,
  COMMITTED: 4,
  SKIPPED: 5,
};

export const DRAFT_STATUS_BADGE: Record<
  DraftRowStatus,
  "destructive" | "warning" | "success" | "secondary"
> = {
  ERROR: "destructive",
  WARNING: "warning",
  VALID: "success",
  PENDING: "secondary",
  COMMITTED: "secondary",
  SKIPPED: "secondary",
};

export const parseTimelineRange = (
  windows: { dayOfWeek: number; startMinute: number; endMinute: number }[],
  dayOfWeek: number,
) => {
  const dayWindows = windows.filter((window) => window.dayOfWeek === dayOfWeek);
  if (dayWindows.length === 0) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  const startMinute = Math.min(
    ...dayWindows.map((window) => window.startMinute),
  );
  const endMinute = Math.max(...dayWindows.map((window) => window.endMinute));
  const startHour = Math.max(0, Math.floor(startMinute / 60));
  const endHour = Math.min(24, Math.ceil(endMinute / 60));

  if (endHour <= startHour) {
    return { startHour: DEFAULT_START_HOUR, endHour: DEFAULT_END_HOUR };
  }

  return { startHour, endHour };
};

export const getMinuteOfDay = (instant: Date | string, timeZone: string) => {
  const zoned = getZonedDate(instant, timeZone);
  return zoned.getHours() * 60 + zoned.getMinutes();
};

export const getEndMinuteForDayKey = (
  dayKey: string,
  instant: Date | string,
  timeZone: string,
) => {
  const endMinute = getMinuteOfDay(instant, timeZone);
  const endDayKey = getZonedDayKey(instant, timeZone);

  if (endDayKey !== dayKey && endMinute === 0) {
    return 24 * 60;
  }

  return endMinute;
};

export const buildDateFromDayKey = (
  dayKey: string,
  startMinute: number,
  timeZone: string,
) => {
  const dayStart = getZonedDayRangeFromDayKey(dayKey, timeZone).start;
  return addMinutes(dayStart, startMinute);
};

export const formatDateTimeInput = (date: Date, timeZone: string) =>
  format(getZonedDate(date, timeZone), "yyyy-MM-dd'T'HH:mm");

export const parseDateTimeInput = (value: string, timeZone: string) => {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }
  return new TZDate(year, month - 1, day, hour, minute, timeZone);
};

export const blockTypeOptions = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "WALK_IN", label: "Walk-in" },
] as const;

export const customBlockSchema = z.object({
  blockType: z.enum(["MAINTENANCE", "WALK_IN"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  reason: z.string().trim().optional(),
});

export type CustomBlockFormValues = z.infer<typeof customBlockSchema>;

export const guestBookingFormSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  guestMode: z.enum(["existing", "new"]),
  guestProfileId: z.string().optional(),
  newGuestName: z.string().optional(),
  newGuestPhone: z.string().optional(),
  newGuestEmail: z.string().optional(),
  notes: z.string().optional(),
});

export type GuestBookingFormValues = z.infer<typeof guestBookingFormSchema>;
