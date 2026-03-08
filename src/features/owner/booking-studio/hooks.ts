"use client";

import { addDays } from "date-fns";
import { parseAsString, useQueryState } from "nuqs";
import * as React from "react";
import { formatInTimeZone } from "@/common/format";
import {
  getZonedDayKey,
  getZonedDayRangeFromDayKey,
  getZonedToday,
} from "@/common/time-zone";
import { getWeekDayKeys, getWeekLabel, getWeekStartDayKey } from "./helpers";

type BookingStudioViewOptions = {
  timeZone: string;
  weekStartsOn?: number;
};

export const useBookingStudioViewState = (
  options: BookingStudioViewOptions,
) => {
  const { timeZone, weekStartsOn = 0 } = options;
  const [dayKeyParam, setDayKeyParam] = useQueryState(
    "dayKey",
    parseAsString.withOptions({ history: "replace" }),
  );
  const [viewParam, setViewParam] = useQueryState(
    "view",
    parseAsString.withOptions({ history: "replace" }),
  );

  React.useEffect(() => {
    if (viewParam !== null) {
      setViewParam(null);
    }
  }, [setViewParam, viewParam]);

  const fallbackDayKey = React.useMemo(
    () => getZonedDayKey(getZonedToday(timeZone), timeZone),
    [timeZone],
  );
  const dayKey = dayKeyParam ?? fallbackDayKey;

  React.useEffect(() => {
    if (!dayKeyParam) {
      setDayKeyParam(fallbackDayKey);
    }
  }, [dayKeyParam, fallbackDayKey, setDayKeyParam]);

  const selectedDayRange = React.useMemo(
    () => getZonedDayRangeFromDayKey(dayKey, timeZone),
    [dayKey, timeZone],
  );
  const selectedDayStart = selectedDayRange.start;
  const selectedDate = React.useMemo(
    () => new Date(selectedDayStart.getTime()),
    [selectedDayStart],
  );
  const selectedDayLabel = React.useMemo(
    () => formatInTimeZone(selectedDayStart, timeZone, "EEEE, MMMM d, yyyy"),
    [selectedDayStart, timeZone],
  );

  const weekStartDayKey = React.useMemo(
    () => getWeekStartDayKey(dayKey, timeZone, weekStartsOn),
    [dayKey, timeZone, weekStartsOn],
  );
  const weekDayKeys = React.useMemo(
    () => getWeekDayKeys(weekStartDayKey, timeZone),
    [timeZone, weekStartDayKey],
  );
  const weekLabel = React.useMemo(
    () => getWeekLabel(weekDayKeys, weekStartDayKey, timeZone),
    [timeZone, weekDayKeys, weekStartDayKey],
  );

  const todayDate = React.useMemo(() => getZonedToday(timeZone), [timeZone]);
  const todayDayKey = React.useMemo(
    () => getZonedDayKey(todayDate, timeZone),
    [timeZone, todayDate],
  );

  const handleMobileDateSelect = React.useCallback(
    (date: Date) => {
      setDayKeyParam(getZonedDayKey(date, timeZone));
    },
    [setDayKeyParam, timeZone],
  );

  const handleMobileToday = React.useCallback(() => {
    setDayKeyParam(getZonedDayKey(todayDate, timeZone));
  }, [setDayKeyParam, timeZone, todayDate]);

  const visibleDayKeys = weekDayKeys;

  const navigateWeek = React.useCallback(
    (direction: 1 | -1) => {
      const weekStart = getZonedDayRangeFromDayKey(
        weekDayKeys[0] ?? dayKey,
        timeZone,
      ).start;
      const newDayKey = getZonedDayKey(
        addDays(weekStart, direction * 7),
        timeZone,
      );
      setDayKeyParam(newDayKey);
    },
    [dayKey, setDayKeyParam, timeZone, weekDayKeys],
  );

  return {
    dayKey,
    setDayKeyParam,
    selectedDayRange,
    selectedDayStart,
    selectedDate,
    selectedDayLabel,
    weekStartDayKey,
    weekDayKeys,
    weekLabel,
    todayDate,
    todayDayKey,
    visibleDayKeys,
    handleMobileDateSelect,
    handleMobileToday,
    navigateWeek,
  };
};
