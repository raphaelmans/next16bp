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

export function useModExternalOpenPlaysByPlace(input: {
  placeId: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { enabled = true, limit = 20, ...rest } = input;
  return useFeatureQuery(
    ["openPlay", "listExternalByPlace"],
    openPlayApi.queryOpenPlayListExternalByPlace,
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

export function useQueryExternalOpenPlayPublicDetail(
  externalOpenPlayId: string,
  enabled = true,
) {
  return useFeatureQuery(
    ["openPlay", "getExternalPublicDetail"],
    openPlayApi.queryOpenPlayGetExternalPublicDetail,
    { externalOpenPlayId },
    {
      enabled: enabled && Boolean(externalOpenPlayId),
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  );
}

export function useQueryExternalOpenPlayDetail(
  externalOpenPlayId: string,
  enabled = true,
) {
  return useFeatureQuery(
    ["openPlay", "getExternalDetail"],
    openPlayApi.queryOpenPlayGetExternalDetail,
    { externalOpenPlayId },
    {
      enabled: enabled && Boolean(externalOpenPlayId),
      refetchOnWindowFocus: true,
      staleTime: 10_000,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (!data) return false;
        const hasStarted =
          Date.parse(data.externalOpenPlay.startsAtIso) <= Date.now();
        if (hasStarted) return false;
        if (data.externalOpenPlay.status !== "ACTIVE") return false;
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
      const reservationId = (variables as { reservationId: string })
        .reservationId;
      toast.success("Open Play created");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId: data.openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({ openPlayId: data.openPlayId }),
        utils.openPlay.getForReservation.invalidate({
          reservationId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create Open Play");
    },
  });
}

export function useMutCreateExternalOpenPlay() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayCreateExternal, {
    onSuccess: async (data, variables) => {
      const placeId = (variables as { placeId: string }).placeId;
      toast.success("External Open Play created");
      await Promise.all([
        utils.openPlay.listExternalByPlace.invalidate({
          placeId,
          limit: 20,
        }),
        utils.openPlay.getExternalPublicDetail.invalidate({
          externalOpenPlayId: data.externalOpenPlayId,
        }),
        utils.openPlay.getExternalDetail.invalidate({
          externalOpenPlayId: data.externalOpenPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Failed to create External Open Play");
    },
  });
}

export function useMutCreateOpenPlayFromReservationGroup() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayCreateFromReservationGroup, {
    onSuccess: async (data, variables) => {
      const reservationGroupId = (variables as { reservationGroupId: string })
        .reservationGroupId;
      toast.success("Open Play created");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId: data.openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({ openPlayId: data.openPlayId }),
        utils.openPlay.getForReservationGroup.invalidate({
          reservationGroupId,
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
      const openPlayId = (variables as { openPlayId: string }).openPlayId;
      toast.success(
        data.status === "CONFIRMED"
          ? "Joined Open Play"
          : data.status === "WAITLISTED"
            ? "Waitlisted"
            : "Join request sent",
      );
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({
          openPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to join Open Play");
    },
  });
}

export function useMutRequestJoinExternalOpenPlay() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayRequestToJoinExternal, {
    onSuccess: async (data, variables) => {
      const externalOpenPlayId = (variables as { externalOpenPlayId: string })
        .externalOpenPlayId;
      toast.success(
        data.status === "CONFIRMED"
          ? "Joined External Open Play"
          : data.status === "WAITLISTED"
            ? "Waitlisted"
            : "Join request sent",
      );
      await Promise.all([
        utils.openPlay.getExternalPublicDetail.invalidate({
          externalOpenPlayId,
        }),
        utils.openPlay.getExternalDetail.invalidate({
          externalOpenPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to join External Open Play");
    },
  });
}

export function useMutLeaveOpenPlay() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayLeave, {
    onSuccess: async (_data, variables) => {
      const openPlayId = (variables as { openPlayId: string }).openPlayId;
      toast.success("Left Open Play");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({
          openPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to leave Open Play");
    },
  });
}

export function useMutLeaveExternalOpenPlay() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayLeaveExternal, {
    onSuccess: async (_data, variables) => {
      const externalOpenPlayId = (variables as { externalOpenPlayId: string })
        .externalOpenPlayId;
      toast.success("Left External Open Play");
      await Promise.all([
        utils.openPlay.getExternalPublicDetail.invalidate({
          externalOpenPlayId,
        }),
        utils.openPlay.getExternalDetail.invalidate({
          externalOpenPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to leave External Open Play");
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

export function useMutDecideExternalOpenPlayParticipant() {
  const utils = trpc.useUtils();

  return useFeatureMutation(openPlayApi.mutOpenPlayDecideExternalParticipant, {
    onSuccess: async () => {
      toast.success("External participant updated");
      await utils.openPlay.getExternalDetail.invalidate();
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to update external participant");
    },
  });
}

export function useMutCloseOpenPlay() {
  const utils = trpc.useUtils();
  return useFeatureMutation(openPlayApi.mutOpenPlayClose, {
    onSuccess: async (_data, variables) => {
      const openPlayId = (variables as { openPlayId: string }).openPlayId;
      toast.success("Open Play closed");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({
          openPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to close Open Play");
    },
  });
}

export function useMutCloseExternalOpenPlay() {
  const utils = trpc.useUtils();
  return useFeatureMutation(openPlayApi.mutOpenPlayCloseExternal, {
    onSuccess: async (_data, variables) => {
      const externalOpenPlayId = (variables as { externalOpenPlayId: string })
        .externalOpenPlayId;
      toast.success("External Open Play closed");
      await Promise.all([
        utils.openPlay.getExternalPublicDetail.invalidate({
          externalOpenPlayId,
        }),
        utils.openPlay.getExternalDetail.invalidate({
          externalOpenPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to close External Open Play");
    },
  });
}

export function useMutCancelOpenPlay() {
  const utils = trpc.useUtils();
  return useFeatureMutation(openPlayApi.mutOpenPlayCancel, {
    onSuccess: async (_data, variables) => {
      const openPlayId = (variables as { openPlayId: string }).openPlayId;
      toast.success("Open Play cancelled");
      await Promise.all([
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId,
        }),
        utils.openPlay.getDetail.invalidate({
          openPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to cancel Open Play");
    },
  });
}

export function useMutCancelExternalOpenPlay() {
  const utils = trpc.useUtils();
  return useFeatureMutation(openPlayApi.mutOpenPlayCancelExternal, {
    onSuccess: async (_data, variables) => {
      const externalOpenPlayId = (variables as { externalOpenPlayId: string })
        .externalOpenPlayId;
      toast.success("External Open Play cancelled");
      await Promise.all([
        utils.openPlay.getExternalPublicDetail.invalidate({
          externalOpenPlayId,
        }),
        utils.openPlay.getExternalDetail.invalidate({
          externalOpenPlayId,
        }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to cancel External Open Play");
    },
  });
}

export function useMutReportExternalOpenPlay() {
  return useFeatureMutation(openPlayApi.mutOpenPlayReportExternal, {
    onSuccess: (data) => {
      if (data.hidden) {
        toast.success("Report submitted. This session is now hidden.");
        return;
      }
      toast.success("Report submitted.");
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to report External Open Play");
    },
  });
}

export function useMutPromoteExternalOpenPlayToVerified() {
  const utils = trpc.useUtils();
  return useFeatureMutation(openPlayApi.mutOpenPlayPromoteExternalToVerified, {
    onSuccess: async (data) => {
      toast.success("External session promoted to verified Open Play");
      await Promise.all([
        utils.openPlay.getDetail.invalidate({ openPlayId: data.openPlayId }),
        utils.openPlay.getPublicDetail.invalidate({
          openPlayId: data.openPlayId,
        }),
        utils.openPlay.getExternalDetail.invalidate(),
        utils.openPlay.listExternalByPlace.invalidate(),
        utils.openPlay.listByPlace.invalidate(),
      ]);
    },
    onError: (error) => {
      toast.error(error?.message || "Unable to promote External Open Play");
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
