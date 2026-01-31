"use client";

import { addDays } from "date-fns";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import * as React from "react";
import { formatInTimeZone } from "@/common/format";
import {
  getZonedDayKey,
  getZonedDayRangeFromDayKey,
  getZonedToday,
} from "@/common/time-zone";
import {
  type StudioView,
  studioViewSchema,
} from "@/features/owner/components/booking-studio/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { getWeekDayKeys, getWeekLabel, getWeekStartDayKey } from "./helpers";

type BookingStudioViewOptions = {
  timeZone: string;
  weekStartsOn?: number;
  defaultView?: StudioView;
  forceDayOnMobile?: boolean;
};

export const useBookingStudioViewState = (
  options: BookingStudioViewOptions,
) => {
  const {
    timeZone,
    weekStartsOn = 0,
    defaultView = "week",
    forceDayOnMobile = true,
  } = options;

  const isMobile = useIsMobile();
  const [dayKeyParam, setDayKeyParam] = useQueryState(
    "dayKey",
    parseAsString.withOptions({ history: "replace" }),
  );
  const [viewParam, setViewParam] = useQueryState(
    "view",
    parseAsStringLiteral(studioViewSchema).withOptions({ history: "replace" }),
  );

  const view = (viewParam ?? defaultView) as StudioView;
  const isWeekView = view === "week";

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

  React.useEffect(() => {
    if (isMobile && forceDayOnMobile && view !== "day") {
      setViewParam("day");
    }
  }, [forceDayOnMobile, isMobile, setViewParam, view]);

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

  const visibleDayKeys = React.useMemo(() => {
    if (isWeekView) return weekDayKeys;
    return [dayKey];
  }, [dayKey, isWeekView, weekDayKeys]);

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
    view,
    setViewParam,
    isWeekView,
    isMobile,
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
