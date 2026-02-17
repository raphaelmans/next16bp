"use client";

import { toast } from "sonner";
import { trpc } from "@/trpc/client";

export function useOpenPlaysByPlace(input: {
  placeId: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { enabled = true, limit = 20, ...rest } = input;
  return trpc.openPlay.listByPlace.useQuery(
    {
      placeId: rest.placeId,
      fromIso: rest.fromIso,
      toIso: rest.toIso,
      limit,
    },
    { enabled },
  );
}

export function useOpenPlayPublicDetail(openPlayId: string, enabled = true) {
  return trpc.openPlay.getPublicDetail.useQuery(
    { openPlayId },
    {
      enabled: enabled && Boolean(openPlayId),
      refetchOnWindowFocus: true,
      staleTime: 10_000,
    },
  );
}

export function useOpenPlayDetail(openPlayId: string, enabled = true) {
  return trpc.openPlay.getDetail.useQuery(
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
        // Poll on host view, or when joiner is awaiting a decision.
        if (data.viewer.role === "host") return 15_000;
        return data.viewer.myStatus === "REQUESTED" ||
          data.viewer.myStatus === "WAITLISTED"
          ? 15_000
          : false;
      },
    },
  );
}

export function useOpenPlayForReservation(
  reservationId: string,
  enabled = true,
) {
  return trpc.openPlay.getForReservation.useQuery(
    { reservationId },
    { enabled: enabled && Boolean(reservationId) },
  );
}

export function useCreateOpenPlayFromReservation() {
  const utils = trpc.useUtils();

  return trpc.openPlay.createFromReservation.useMutation({
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
      toast.error(error.message || "Failed to create Open Play");
    },
  });
}

export function useRequestJoinOpenPlay() {
  const utils = trpc.useUtils();

  return trpc.openPlay.requestToJoin.useMutation({
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
      toast.error(error.message || "Unable to join Open Play");
    },
  });
}

export function useLeaveOpenPlay() {
  const utils = trpc.useUtils();

  return trpc.openPlay.leave.useMutation({
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
      toast.error(error.message || "Unable to leave Open Play");
    },
  });
}

export function useDecideOpenPlayParticipant() {
  const utils = trpc.useUtils();

  return trpc.openPlay.decideParticipant.useMutation({
    onSuccess: async (_data, _variables) => {
      toast.success("Participant updated");
      // We don't know openPlayId here; refresh will happen via detail refetch.
      await utils.openPlay.getDetail.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Unable to update participant");
    },
  });
}

export function useCloseOpenPlay() {
  const utils = trpc.useUtils();
  return trpc.openPlay.close.useMutation({
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
      toast.error(error.message || "Unable to close Open Play");
    },
  });
}

export function useCancelOpenPlay() {
  const utils = trpc.useUtils();
  return trpc.openPlay.cancel.useMutation({
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
      toast.error(error.message || "Unable to cancel Open Play");
    },
  });
}
