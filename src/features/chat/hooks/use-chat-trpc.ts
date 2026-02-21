"use client";

import {
  useFeatureMutation,
  useFeatureQuery,
} from "@/common/feature-api-hooks";
import { trpc } from "@/trpc/client";
import { getChatApi } from "../api.runtime";

const chatApi = getChatApi();

export function useQueryChatAuth(
  input?: Parameters<typeof chatApi.queryChatGetAuth>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["chat", "getAuth"],
    chatApi.queryChatGetAuth,
    input,
    options,
  );
}

export function useQueryChatPocAuth(
  input?: Parameters<typeof chatApi.queryChatPocGetAuth>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["chatPoc", "getAuth"],
    chatApi.queryChatPocGetAuth,
    input,
    options,
  );
}

export function useMutChatPocGetOrCreateDm(options?: Record<string, unknown>) {
  return useFeatureMutation(chatApi.mutChatPocGetOrCreateDm, options);
}

export function useQueryReservationChatSession(
  input?: Parameters<typeof chatApi.queryReservationChatGetSession>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["reservationChat", "getSession"],
    chatApi.queryReservationChatGetSession,
    input,
    options,
  );
}

export function useMutReservationChatSendMessage(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(chatApi.mutReservationChatSendMessage, options);
}

export function useQueryReservationChatThreadMetas(
  input?: Parameters<typeof chatApi.queryReservationChatGetThreadMetas>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["reservationChat", "getThreadMetas"],
    chatApi.queryReservationChatGetThreadMetas,
    input,
    options,
  );
}

export function useMutSupportChatBackfillClaimThreads(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    chatApi.mutSupportChatBackfillClaimThreads,
    options,
  );
}

export function useMutSupportChatSendClaimMessage(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(chatApi.mutSupportChatSendClaimMessage, options);
}

export function useMutSupportChatSendVerificationMessage(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(
    chatApi.mutSupportChatSendVerificationMessage,
    options,
  );
}

export function useQuerySupportChatClaimSession(
  input?: Parameters<typeof chatApi.querySupportChatGetClaimSession>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["supportChat", "getClaimSession"],
    chatApi.querySupportChatGetClaimSession,
    input,
    options,
  );
}

export function useQuerySupportChatVerificationSession(
  input?: Parameters<typeof chatApi.querySupportChatGetVerificationSession>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["supportChat", "getVerificationSession"],
    chatApi.querySupportChatGetVerificationSession,
    input,
    options,
  );
}

export function useMutChatInboxArchiveThread(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(chatApi.mutChatInboxArchiveThread, options);
}

export function useMutChatInboxUnarchiveThread(
  options?: Record<string, unknown>,
) {
  return useFeatureMutation(chatApi.mutChatInboxUnarchiveThread, options);
}

export function useQueryChatInboxListArchivedThreadIds(
  input?: Parameters<typeof chatApi.queryChatInboxListArchivedThreadIds>[0],
  options?: Record<string, unknown>,
) {
  return useFeatureQuery(
    ["chatInbox", "listArchivedThreadIds"],
    chatApi.queryChatInboxListArchivedThreadIds,
    input,
    options,
  );
}

export function useModChatInvalidation() {
  const cache = trpc.useUtils();

  const invalidateReservationThreadMetas = (
    ...args: Parameters<typeof cache.reservationChat.getThreadMetas.invalidate>
  ) => cache.reservationChat.getThreadMetas.invalidate(...args);

  const fetchReservationThreadMetas = (
    ...args: Parameters<typeof cache.reservationChat.getThreadMetas.fetch>
  ) => cache.reservationChat.getThreadMetas.fetch(...args);

  const invalidateChatInboxListArchivedThreadIds = (
    ...args: Parameters<typeof cache.chatInbox.listArchivedThreadIds.invalidate>
  ) => cache.chatInbox.listArchivedThreadIds.invalidate(...args);

  const fetchChatInboxListArchivedThreadIds = (
    ...args: Parameters<typeof cache.chatInbox.listArchivedThreadIds.fetch>
  ) => cache.chatInbox.listArchivedThreadIds.fetch(...args);

  return {
    invalidateReservationThreadMetas,
    fetchReservationThreadMetas,
    invalidateChatInboxListArchivedThreadIds,
    fetchChatInboxListArchivedThreadIds,
  };
}
