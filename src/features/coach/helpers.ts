export const COACH_DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

const pad = (value: number) => String(value).padStart(2, "0");

export function getCoachDayLabel(dayOfWeek: number) {
  return (
    COACH_DAY_OPTIONS.find((option) => option.value === dayOfWeek)?.label ??
    "Day"
  );
}

export function minutesToTimeString(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${pad(hours)}:${pad(mins)}`;
}

export function timeStringToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }

  return hours * 60 + minutes;
}

export function formatDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function buildDateRangeIso(startDate: string, endDate: string) {
  return {
    startTime: new Date(`${startDate}T00:00:00`).toISOString(),
    endTime: new Date(`${endDate}T23:59:59`).toISOString(),
  };
}

export function formatDateTimeInputValue(date: Date) {
  return `${formatDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isoToLocalDateTimeInput(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return formatDateTimeInputValue(date);
}

export function localDateTimeInputToIso(value: string) {
  return new Date(value).toISOString();
}

export function formatBlockDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function createLocalEditorId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `local-${Math.random().toString(36).slice(2, 10)}`
  );
}
