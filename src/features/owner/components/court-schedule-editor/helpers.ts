export const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const DAY_KEYS = DAY_OPTIONS.map((day) => day.value);
export const CURRENCY_OPTIONS = ["PHP", "USD"] as const;
export const DEFAULT_CURRENCY = "PHP";

export type HoursWindow = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

export type RateRule = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  currency: string;
  hourlyRateCents: number;
};

export type BlockRow = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isOpen: boolean;
  currency: string;
  hourlyRate: number | "";
  allowPricing: boolean;
};

export type BlockSegment = Omit<BlockRow, "id">;

export type BlockIntervals = {
  rowId: string;
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
};

export const createRowId = () =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const toTimeString = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const parseTime = (value: string) => {
  if (!value) return null;
  const [hours, mins] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return hours * 60 + mins;
};

export const createEmptyRow = (dayOfWeek: number): BlockRow => ({
  id: createRowId(),
  dayOfWeek,
  startTime: "08:00",
  endTime: "20:00",
  isOpen: true,
  currency: DEFAULT_CURRENCY,
  hourlyRate: "",
  allowPricing: true,
});

export const buildIntervals = (row: BlockRow): BlockIntervals[] => {
  const startMinute = parseTime(row.startTime);
  const endMinute = parseTime(row.endTime);
  if (startMinute === null || endMinute === null) return [];
  if (endMinute > startMinute) {
    return [
      {
        rowId: row.id,
        dayOfWeek: row.dayOfWeek,
        startMinute,
        endMinute,
      },
    ];
  }
  const nextDay = (row.dayOfWeek + 1) % 7;
  const intervals: BlockIntervals[] = [
    {
      rowId: row.id,
      dayOfWeek: row.dayOfWeek,
      startMinute,
      endMinute: 1440,
    },
  ];
  if (endMinute > 0) {
    intervals.push({
      rowId: row.id,
      dayOfWeek: nextDay,
      startMinute: 0,
      endMinute: endMinute,
    });
  }
  return intervals;
};

export const mergeSegments = (segments: BlockSegment[]) => {
  if (segments.length === 0) return [] as BlockRow[];
  const merged: BlockSegment[] = [segments[0]];
  for (let i = 1; i < segments.length; i += 1) {
    const current = segments[i];
    const previous = merged[merged.length - 1];
    const isSameBlock =
      previous.endTime === current.startTime &&
      previous.isOpen === current.isOpen &&
      previous.currency === current.currency &&
      previous.hourlyRate === current.hourlyRate &&
      previous.allowPricing === current.allowPricing;
    if (isSameBlock) {
      previous.endTime = current.endTime;
    } else {
      merged.push(current);
    }
  }
  return merged.map((segment) => ({ ...segment, id: createRowId() }));
};

export const buildRowsByDay = (hours: HoursWindow[], rules: RateRule[]) => {
  const result: Record<number, BlockRow[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  DAY_KEYS.forEach((day) => {
    const dayHours = hours
      .filter((window) => window.dayOfWeek === day)
      .sort((a, b) => a.startMinute - b.startMinute);
    const dayRules = rules
      .filter((rule) => rule.dayOfWeek === day)
      .sort((a, b) => a.startMinute - b.startMinute);
    const boundaries = new Set<number>();
    dayHours.forEach((window) => {
      boundaries.add(window.startMinute);
      boundaries.add(window.endMinute);
    });
    dayRules.forEach((rule) => {
      boundaries.add(rule.startMinute);
      boundaries.add(rule.endMinute);
    });

    const sorted = Array.from(boundaries).sort((a, b) => a - b);
    const segments: BlockSegment[] = [];

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const startMinute = sorted[i];
      const endMinute = sorted[i + 1];
      if (startMinute === endMinute) continue;

      const hoursWindow = dayHours.find(
        (window) =>
          window.startMinute <= startMinute && window.endMinute >= endMinute,
      );
      const pricingRule = dayRules.find(
        (rule) =>
          rule.startMinute <= startMinute && rule.endMinute >= endMinute,
      );

      if (!hoursWindow && !pricingRule) continue;

      const hourlyRate = pricingRule ? pricingRule.hourlyRateCents / 100 : "";
      const isOpen = Boolean(hoursWindow);
      const allowPricing = isOpen || hourlyRate !== "";
      segments.push({
        dayOfWeek: day,
        startTime: toTimeString(startMinute),
        endTime: toTimeString(endMinute),
        isOpen,
        currency: pricingRule?.currency ?? DEFAULT_CURRENCY,
        hourlyRate,
        allowPricing,
      });
    }

    result[day] = mergeSegments(segments);
  });

  return result;
};

export const isRowsByDayEmpty = (rowsByDay: Record<number, BlockRow[]>) =>
  DAY_KEYS.every((day) => (rowsByDay[day] ?? []).length === 0);

export const createDefaultRowsByDay = (): Record<number, BlockRow[]> => {
  const seeded: Record<number, BlockRow[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  };

  DAY_KEYS.forEach((day) => {
    seeded[day] = [createEmptyRow(day)];
  });

  return seeded;
};

export const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export type ScheduleValidation = {
  invalidRows: Set<string>;
  openWithoutPrice: Set<string>;
  closedWithPrice: Set<string>;
  overnightRows: Set<string>;
  overlappingHours: Set<string>;
  overlappingPricing: Set<string>;
  hasBlockingIssues: boolean;
};

export const buildScheduleValidation = (
  rowsByDay: Record<number, BlockRow[]>,
): ScheduleValidation => {
  const invalidRows = new Set<string>();
  const openWithoutPrice = new Set<string>();
  const closedWithPrice = new Set<string>();
  const overnightRows = new Set<string>();
  const overlappingHours = new Set<string>();
  const overlappingPricing = new Set<string>();

  const openIntervals = new Map<number, BlockIntervals[]>();
  const pricingIntervals = new Map<number, BlockIntervals[]>();

  DAY_KEYS.forEach((day) => {
    openIntervals.set(day, []);
    pricingIntervals.set(day, []);
  });

  Object.values(rowsByDay).forEach((rows) => {
    rows.forEach((row) => {
      const startMinute = parseTime(row.startTime);
      const endMinute = parseTime(row.endTime);
      if (startMinute === null || endMinute === null) {
        invalidRows.add(row.id);
        return;
      }
      if (endMinute <= startMinute) {
        overnightRows.add(row.id);
      }
      if (row.isOpen && row.hourlyRate === "") {
        openWithoutPrice.add(row.id);
      }
      if (!row.isOpen && row.hourlyRate !== "") {
        closedWithPrice.add(row.id);
      }

      const intervals = buildIntervals(row);
      if (row.isOpen) {
        intervals.forEach((interval) => {
          openIntervals.get(interval.dayOfWeek)?.push(interval);
        });
      }
      if (row.hourlyRate !== "") {
        intervals.forEach((interval) => {
          pricingIntervals.get(interval.dayOfWeek)?.push(interval);
        });
      }
    });
  });

  const markOverlaps = (
    intervalsByDay: Map<number, BlockIntervals[]>,
    target: Set<string>,
  ) => {
    intervalsByDay.forEach((intervals) => {
      const sorted = [...intervals].sort(
        (a, b) => a.startMinute - b.startMinute,
      );
      for (let i = 1; i < sorted.length; i += 1) {
        const previous = sorted[i - 1];
        const current = sorted[i];
        if (current.startMinute < previous.endMinute) {
          target.add(previous.rowId);
          target.add(current.rowId);
        }
      }
    });
  };

  markOverlaps(openIntervals, overlappingHours);
  markOverlaps(pricingIntervals, overlappingPricing);

  return {
    invalidRows,
    openWithoutPrice,
    closedWithPrice,
    overnightRows,
    overlappingHours,
    overlappingPricing,
    hasBlockingIssues:
      invalidRows.size > 0 ||
      overlappingHours.size > 0 ||
      overlappingPricing.size > 0,
  };
};
