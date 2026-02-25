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
  type BlockIntervals,
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
        const sourceRow = (prev[sourceDay] ?? []).find(
          (row) => row.id === sourceRowId,
        );
        if (!sourceRow || sourceRow.hourlyRate === "") return prev;

        const overlaps = (a: BlockIntervals, b: BlockIntervals) =>
          Math.max(a.startMinute, b.startMinute) <
          Math.min(a.endMinute, b.endMinute);

        const buildIntervalMap = (
          rowsByDay: Record<number, BlockRow[]>,
          predicate: (row: BlockRow) => boolean,
          excludeRowId?: string,
        ) => {
          const map = new Map<number, BlockIntervals[]>();
          DAY_KEYS.forEach((day) => {
            map.set(day, []);
          });

          Object.values(rowsByDay).forEach((rows) => {
            rows.forEach((row) => {
              if (excludeRowId && row.id === excludeRowId) return;
              if (!predicate(row)) return;
              buildIntervals(row).forEach((interval) => {
                map.get(interval.dayOfWeek)?.push(interval);
              });
            });
          });

          return map;
        };
        const next: Record<number, BlockRow[]> = {
          0: [...(prev[0] ?? [])],
          1: [...(prev[1] ?? [])],
          2: [...(prev[2] ?? [])],
          3: [...(prev[3] ?? [])],
          4: [...(prev[4] ?? [])],
          5: [...(prev[5] ?? [])],
          6: [...(prev[6] ?? [])],
        };

        let applied = 0;
        let skipped = 0;

        DAY_KEYS.forEach((currentDay) => {
          const existingRows = next[currentDay] ?? [];

          if (currentDay === sourceDay) return;

          const alreadyExists = existingRows.some(
            (row) =>
              row.startTime === sourceRow.startTime &&
              row.endTime === sourceRow.endTime &&
              row.isOpen === sourceRow.isOpen &&
              row.hourlyRate === sourceRow.hourlyRate &&
              row.allowPricing === true,
          );
          if (alreadyExists) {
            skipped += 1;
            return;
          }

          const matchingRow = existingRows.find(
            (row) =>
              row.startTime === sourceRow.startTime &&
              row.endTime === sourceRow.endTime,
          );

          const candidate: BlockRow = matchingRow
            ? {
                ...matchingRow,
                startTime: sourceRow.startTime,
                endTime: sourceRow.endTime,
                isOpen: sourceRow.isOpen,
                hourlyRate: sourceRow.hourlyRate,
                allowPricing: true,
              }
            : {
                ...sourceRow,
                id: createRowId(),
                dayOfWeek: currentDay,
                allowPricing: true,
              };

          const hoursIntervalsByDay = buildIntervalMap(
            next,
            (row) => row.isOpen,
            matchingRow?.id,
          );
          const pricingIntervalsByDay = buildIntervalMap(
            next,
            (row) => row.hourlyRate !== "",
            matchingRow?.id,
          );
          const candidateIntervals = buildIntervals(candidate);
          const hasHoursOverlap =
            candidate.isOpen &&
            candidateIntervals.some((interval) =>
              (hoursIntervalsByDay.get(interval.dayOfWeek) ?? []).some(
                (existing) => overlaps(interval, existing),
              ),
            );
          const hasPricingOverlap =
            candidate.hourlyRate !== "" &&
            candidateIntervals.some((interval) =>
              (pricingIntervalsByDay.get(interval.dayOfWeek) ?? []).some(
                (existing) => overlaps(interval, existing),
              ),
            );

          if (hasHoursOverlap || hasPricingOverlap) {
            skipped += 1;
            return;
          }

          if (matchingRow) {
            next[currentDay] = existingRows.map((row) =>
              row.id === matchingRow.id ? candidate : row,
            );
          } else {
            next[currentDay].push(candidate);
          }
          applied += 1;
        });

        if (applied === 0) {
          toast.info("No days updated", {
            description: skipped > 0 ? "All days were skipped." : undefined,
          });
        } else {
          toast.success(
            `Copied block to ${applied} day${applied === 1 ? "" : "s"}`,
            {
              description:
                skipped > 0
                  ? `Skipped ${skipped} day${skipped === 1 ? "" : "s"} due to overlaps or existing blocks.`
                  : undefined,
            },
          );
        }

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
