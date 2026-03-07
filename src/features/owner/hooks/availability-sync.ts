"use client";

import { produce } from "immer";
import { useEffect } from "react";
import { getReservationRealtimeApi } from "@/features/reservation/realtime-api.runtime";
import { useModReservationSync } from "@/features/reservation/sync";

const reservationRealtimeApi = getReservationRealtimeApi();

type RangeBlock = {
  id: string;
  startTime: string;
  endTime: string;
};

export const appendAvailabilityBlock = <TBlock extends RangeBlock>(
  blocks: TBlock[] | undefined,
  nextBlock: TBlock,
) =>
  produce(blocks ?? [], (draft) => {
    draft.push(nextBlock as (typeof draft)[number]);
  });

export const replaceAvailabilityBlock = <TBlock extends RangeBlock>(
  blocks: TBlock[] | undefined,
  targetBlockId: string | undefined,
  nextBlock: TBlock,
) =>
  produce(blocks ?? [], (draft) => {
    if (!targetBlockId) {
      draft.push(nextBlock as (typeof draft)[number]);
      return;
    }

    const existingIndex = draft.findIndex(
      (block) => block.id === targetBlockId,
    );
    if (existingIndex === -1) {
      draft.push(nextBlock as (typeof draft)[number]);
      return;
    }

    draft[existingIndex] = nextBlock as (typeof draft)[number];
  });

export const removeAvailabilityBlock = <TBlock extends RangeBlock>(
  blocks: TBlock[] | undefined,
  blockId: string,
) =>
  produce(blocks ?? [], (draft) => {
    const existingIndex = draft.findIndex((block) => block.id === blockId);
    if (existingIndex >= 0) {
      draft.splice(existingIndex, 1);
    }
  });

export const updateAvailabilityBlockRange = <TBlock extends RangeBlock>(
  blocks: TBlock[] | undefined,
  blockId: string,
  nextRange: { startTime: string; endTime: string },
) =>
  produce(blocks ?? [], (draft) => {
    const block = draft.find((entry) => entry.id === blockId);
    if (!block) return;
    block.startTime = nextRange.startTime;
    block.endTime = nextRange.endTime;
  });

export const reconcileAvailabilityBlockInRange = <TBlock extends RangeBlock>(
  blocks: TBlock[] | undefined,
  blockId: string,
  nextBlock: TBlock,
  isInRange: boolean,
) =>
  produce(blocks ?? [], (draft) => {
    const existingIndex = draft.findIndex((block) => block.id === blockId);

    if (!isInRange) {
      if (existingIndex >= 0) {
        draft.splice(existingIndex, 1);
      }
      return;
    }

    if (existingIndex === -1) {
      draft.push(nextBlock as (typeof draft)[number]);
      return;
    }

    draft[existingIndex] = nextBlock as (typeof draft)[number];
  });

export function useModOwnerAvailabilityReservationSync(input: {
  enabled?: boolean;
  reservationsQueryInput?: {
    courtId: string;
    startTime: string;
    endTime: string;
  };
}) {
  const { syncOwnerAvailabilityRange } = useModReservationSync();
  const enabled =
    input.enabled &&
    Boolean(
      input.reservationsQueryInput?.courtId &&
        input.reservationsQueryInput?.startTime &&
        input.reservationsQueryInput?.endTime,
    );

  useEffect(() => {
    if (!enabled || !input.reservationsQueryInput) {
      return;
    }

    const subscription = reservationRealtimeApi.subscribeOwner({
      onEvent: () => {
        void syncOwnerAvailabilityRange(input.reservationsQueryInput);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, input.reservationsQueryInput, syncOwnerAvailabilityRange]);
}
