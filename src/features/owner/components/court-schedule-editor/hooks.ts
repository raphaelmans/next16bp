"use client";

import * as React from "react";
import { toast } from "@/common/toast";
import {
  useModCourtHours,
  useModCourtRateRules,
  useMutCopyCourtHours,
  useMutCopyCourtRateRules,
  useMutSaveCourtHours,
  useMutSaveCourtRateRules,
  useQueryOwnerCourts,
} from "@/features/owner/hooks";
import {
  type BlockRow,
  buildIntervals,
  buildRowsByDay,
  buildScheduleValidation,
  createDefaultRowsByDay,
  createEmptyRow,
  createRowId,
  DAY_KEYS,
  getErrorMessage,
  type HoursWindow,
  isRowsByDayEmpty,
  type RateRule,
} from "./helpers";

type UseCourtScheduleEditorOptions = {
  courtId: string;
  organizationId?: string | null;
  onSaved?: () => void;
  onCopyComplete?: () => void;
};

export const useCourtScheduleEditor = ({
  courtId,
  organizationId,
  onSaved,
  onCopyComplete,
}: UseCourtScheduleEditorOptions) => {
  const { data: hours = [], isLoading: hoursLoading } =
    useModCourtHours(courtId);
  const { data: rules = [], isLoading: rulesLoading } =
    useModCourtRateRules(courtId);
  const saveHours = useMutSaveCourtHours(courtId);
  const saveRules = useMutSaveCourtRateRules(courtId);
  const copyHours = useMutCopyCourtHours(courtId);
  const copyRules = useMutCopyCourtRateRules(courtId);
  const { data: courts = [] } = useQueryOwnerCourts(organizationId ?? null);

  const [rowsByDay, setRowsByDay] = React.useState<Record<number, BlockRow[]>>({
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });
  const [hasInitialized, setHasInitialized] = React.useState(false);
  const [openDays, setOpenDays] = React.useState<number[]>(() => [...DAY_KEYS]);

  React.useEffect(() => {
    if (hoursLoading || rulesLoading || hasInitialized) return;
    const baseRows = buildRowsByDay(
      hours as HoursWindow[],
      rules as RateRule[],
    );
    const nextRows = isRowsByDayEmpty(baseRows)
      ? createDefaultRowsByDay()
      : baseRows;

    setRowsByDay(nextRows);
    setOpenDays([...DAY_KEYS]);

    setHasInitialized(true);
  }, [hasInitialized, hours, hoursLoading, rules, rulesLoading]);

  const isLoading = hoursLoading || rulesLoading;
  const isSaving = saveHours.isPending || saveRules.isPending;
  const isCopying = copyHours.isPending || copyRules.isPending;

  const validation = React.useMemo(
    () => buildScheduleValidation(rowsByDay),
    [rowsByDay],
  );

  const setDayRows = React.useCallback(
    (day: number, updater: (rows: BlockRow[]) => BlockRow[]) => {
      setRowsByDay((prev) => ({
        ...prev,
        [day]: updater(prev[day] ?? []),
      }));
    },
    [],
  );

  const handleAddRow = React.useCallback(
    (day: number) => {
      setDayRows(day, (rows) => [...rows, createEmptyRow(day)]);
    },
    [setDayRows],
  );

  const handleRemoveRow = React.useCallback(
    (day: number, rowId: string) => {
      setDayRows(day, (rows) => rows.filter((row) => row.id !== rowId));
    },
    [setDayRows],
  );

  const handleRowChange = React.useCallback(
    (day: number, rowId: string, changes: Partial<BlockRow>) => {
      setDayRows(day, (rows) =>
        rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                ...changes,
                allowPricing:
                  changes.isOpen === undefined
                    ? (changes.allowPricing ?? row.allowPricing)
                    : changes.isOpen
                      ? true
                      : row.hourlyRate !== "",
              }
            : row,
        ),
      );
    },
    [setDayRows],
  );

  const handleHourlyRateInput = React.useCallback(
    (day: number, rowId: string, rawValue: string) => {
      const parsed = rawValue === "" ? "" : Number(rawValue);
      const hourlyRate = parsed === "" || Number.isNaN(parsed) ? "" : parsed;

      setDayRows(day, (rows) =>
        rows.map((row) =>
          row.id === rowId ? { ...row, hourlyRate, allowPricing: true } : row,
        ),
      );
    },
    [setDayRows],
  );

  const handleApplyToAll = React.useCallback(
    (sourceDay: number, sourceRowId: string) => {
      setRowsByDay((prev) => {
        const sourceRows = prev[sourceDay] ?? [];
        const sourceRow = sourceRows.find((row) => row.id === sourceRowId);
        if (!sourceRow) return prev;

        const next: Record<number, BlockRow[]> = { ...prev };

        DAY_KEYS.forEach((currentDay) => {
          if (currentDay === sourceDay) return;
          next[currentDay] = sourceRows.map((row) => ({
            ...row,
            id: createRowId(),
            dayOfWeek: currentDay,
          }));
        });

        toast.success("Copied schedule to all days");
        return next;
      });
    },
    [],
  );

  const handleCopySchedule = React.useCallback(
    async (sourceCourtId: string) => {
      try {
        const [copiedHours, copiedRules] = await Promise.all([
          copyHours.mutateAsync({ sourceCourtId, targetCourtId: courtId }),
          copyRules.mutateAsync({ sourceCourtId, targetCourtId: courtId }),
        ]);
        const nextRows = buildRowsByDay(copiedHours, copiedRules);
        setRowsByDay(nextRows);
        setOpenDays([...DAY_KEYS]);
        onCopyComplete?.();
        toast.success("Schedule copied");
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to copy schedule"));
      }
    },
    [copyHours, copyRules, courtId, onCopyComplete],
  );

  const handleSave = React.useCallback(async () => {
    if (validation.hasBlockingIssues) {
      toast.error("Resolve overlapping or invalid blocks before saving.");
      return;
    }

    const hoursPayload: HoursWindow[] = [];
    const rulesPayload: RateRule[] = [];

    Object.values(rowsByDay).forEach((rows) => {
      rows.forEach((row) => {
        const intervals = buildIntervals(row);
        if (row.isOpen) {
          intervals.forEach((interval) => {
            hoursPayload.push({
              dayOfWeek: interval.dayOfWeek,
              startMinute: interval.startMinute,
              endMinute: interval.endMinute,
            });
          });
        }

        if (row.hourlyRate !== "") {
          intervals.forEach((interval) => {
            rulesPayload.push({
              dayOfWeek: interval.dayOfWeek,
              startMinute: interval.startMinute,
              endMinute: interval.endMinute,
              hourlyRateCents: Math.round(Number(row.hourlyRate) * 100),
            });
          });
        }
      });
    });

    try {
      await Promise.all([
        saveHours.mutateAsync({ courtId, windows: hoursPayload }),
        saveRules.mutateAsync({ courtId, rules: rulesPayload }),
      ]);
      toast.success("Schedule saved");
      onSaved?.();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save schedule"));
    }
  }, [
    courtId,
    onSaved,
    rowsByDay,
    saveHours,
    saveRules,
    validation.hasBlockingIssues,
  ]);

  return {
    rowsByDay,
    openDays,
    setOpenDays,
    isLoading,
    isSaving,
    isCopying,
    courts,
    validation,
    handleAddRow,
    handleRemoveRow,
    handleRowChange,
    handleHourlyRateInput,
    handleApplyToAll,
    handleCopySchedule,
    handleSave,
  };
};
