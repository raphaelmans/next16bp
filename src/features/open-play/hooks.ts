"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { toast } from "@/common/toast";
import { trpc } from "@/trpc/client";
import { getOpenPlayApi } from "./api.runtime";

const openPlayApi = getOpenPlayApi();

export function useModOpenPlaysByPlace(input: {
  placeId: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { enabled = true, limit = 20, ...rest } = input;
  return useFeatureQuery(
    ["openPlay", "listByPlace"],
    openPlayApi.queryOpenPlayListByPlace,
    {
      placeId: rest.placeId,
      fromIso: rest.fromIso,
      toIso: rest.toIso,
      limit,
    },
    { enabled },
  );
}

export function useQueryOpenPlayPublicDetail(
  openPlayId: string,
  enabled = true,
) {
  return useFeatureQuery(
    ["openPlay", "getPublicDetail"],
    openPlayApi.queryOpenPlayGetPublicDetail,
    { openPlayId },
    {
      enabled: enabled && Boolean(openPlayId),
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  );
}

export function useQueryOpenPlayDetail(openPlayId: string, enabled = true) {
  return useFeatureQuery(
    ["openPlay", "getDetail"],
    openPlayApi.queryOpenPlayGetDetail,
    { openPlayId },
    {
      enabled: enabled && Boolean(openPlayId),
      refetchOnWindowFocus: true,
      staleTime: 10_000,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        const hasStarted = Date.parse(data.openPlay.startsAtIso) <= Date.now();
        if (hasStarted) return false;
        if (data.openPlay.status !== "ACTIVE") return false;
        if (data.viewer.role === "host") return 15_000;
        return data.viewer.myStatus === "REQUESTED" ||
          data.viewer.myStatus === "WAITLISTED"
          ? 15_000
          : false;
      },
    },
  );
}

export function useQueryOpenPlayForReservation(
  reservationId: string,
  enabled = true,
) {
  return useFeatureQuery(
    ["openPlay", "getForReservation"],
    openPlayApi.queryOpenPlayGetForReservation,
    { reservationId },
    { enabled: enabled && Boolean(reservationId) },
  );
}

export function useMutCreateOpenPlayFromReservation() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayCreateFromReservation, {
    onSuccess: async (data, variables) => {
      toast.success("Open Play created");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId: data.openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({ openPlayId: data.openPlayId }),
        utils.openPlay.getForReservation.invalidate({
          reservationId: variables.reservationId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create Open Play");
    },
  });
}

export function useMutRequestJoinOpenPlay() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayRequestToJoin, {
    onSuccess: async (data, variables) => {
      toast.success(
        data.status === "CONFIRMED"
          ? "Joined Open Play"
          : data.status === "WAITLISTED"
            ? "Waitlisted"
            : "Join request sent",
      );
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId: variables.openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({
          openPlayId: variables.openPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to join Open Play");
    },
  });
}

export function useMutLeaveOpenPlay() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayLeave, {
    onSuccess: async (_data, variables) => {
      toast.success("Left Open Play");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId: variables.openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({
          openPlayId: variables.openPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to leave Open Play");
    },
  });
}

export function useMutDecideOpenPlayParticipant() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayDecideParticipant, {
    onSuccess: async () => {
      toast.success("Participant updated");
      await utils.openPlay.getDetail.invalidate();
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to update participant");
    },
  });
}

export function useMutCloseOpenPlay() {
  const utils = trpc.useUtils();
  return useFeatureMutation(openPlayApi.mutOpenPlayClose, {
    onSuccess: async (_data, variables) => {
      toast.success("Open Play closed");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId: variables.openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({
          openPlayId: variables.openPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to close Open Play");
    },
  });
}

export function useMutCancelOpenPlay() {
  const utils = trpc.useUtils();
  return useFeatureMutation(openPlayApi.mutOpenPlayCancel, {
    onSuccess: async (_data, variables) => {
      toast.success("Open Play cancelled");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId: variables.openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({
          openPlayId: variables.openPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to cancel Open Play");
    },
  });
}

export function useQueryOpenPlayChatSession(openPlayId: string) {
  return useFeatureQuery(
    ["openPlayChat", "getSession"],
    openPlayApi.queryOpenPlayChatGetSession,
    { openPlayId },
    { enabled: Boolean(openPlayId) },
  );
}

export function useMutOpenPlayChatSendMessage() {
  return useFeatureMutation(openPlayApi.mutOpenPlayChatSendMessage);
}
