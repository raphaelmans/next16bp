"use client";

import { ArchiveRestore, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Channel } from "stream-chat";
import { formatInTimeZone, formatTimeRangeInTimeZone } from "@/common/format";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  makeReservationGroupThreadId,
  makeReservationThreadId,
  parseReservationGroupThreadId,
  parseReservationThreadId,
} from "@/lib/modules/chat/shared/domain";
import { toReservationThreadTargetsFromThreadIds } from "@/lib/modules/chat/shared/transform";
import { cn } from "@/lib/utils";
import {
  getChatStatusBadgeClassName,
  getReservationReadOnlyReason,
  isReservationMetaArchived,
  parseTimestampMs,
  sortReservationInboxIds,
  sumReservationUnreadCounts,
} from "../../domain";
import {
  useModChatInvalidation,
  useMutChatInboxArchiveThread,
  useMutChatInboxUnarchiveThread,
  useMutReservationChatSendMessage,
  useMutReservationGroupChatSendMessage,
  useQueryChatAuth,
  useQueryChatInboxListArchivedThreadIds,
  useQueryReservationChatThreadMetas,
} from "../../hooks/use-chat-trpc";
import { useModStreamClient } from "../../hooks/useModStreamClient";
import { StreamChatThread } from "../chat-thread/stream-chat-thread";
import { InboxFloatingSheet } from "../inbox-shell/inbox-floating-sheet";

export type ReservationThreadMeta = {
  threadId: string;
  reservationId: string | null;
  reservationGroupId: string | null;
  status: string;
  placeName: string;
  timeZone: string;
  courtLabel: string;
  playerDisplayName: string;
  ownerDisplayName: string;
  updatedAtIso?: string;
  startTimeIso: string;
  endTimeIso: string;
};

type InboxKind = "player" | "owner";
type SyncPhase = "idle" | "syncing" | "partial" | "error";

type ChannelRefreshResult = {
  ok: boolean;
  channels: Channel[];
  error?: unknown;
};

type ReservationChatOpenDetail = {
  reservationId?: string;
  reservationGroupId?: string;
  kind?: InboxKind;
  source?: string;
};

const RESERVATION_CHAT_OPEN_EVENT = "reservation-chat:open";

export interface ReservationInboxWidgetConfig {
  kind: InboxKind;
  storageKeys: {
    open: string;
    activeReservationThreadId: string;
  };
  ui: {
    sheetTitle: string;
    sheetDescription: string;
  };
  labels: {
    listPrimary: (
      meta: ReservationThreadMeta | null,
      threadId: string,
    ) => string | null;
    listSecondary: (meta: ReservationThreadMeta | null) => string | null;
    threadTitle: (meta: ReservationThreadMeta | null) => string;
  };
}

function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return null;
  }

  const className = getChatStatusBadgeClassName(status);

  return (
    <Badge
      variant="outline"
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${className}`}
    >
      {status}
    </Badge>
  );
}

export function ReservationInboxWidget({
  config,
}: {
  config: ReservationInboxWidgetConfig;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isSmall = useMediaQuery("(min-width: 640px)");

  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [_isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [channelsError, setChannelsError] = useState<unknown>(null);
  const [hasLoadedChannelsOnce, setHasLoadedChannelsOnce] = useState(false);
  const [hasLoadedMetasOnce, setHasLoadedMetasOnce] = useState(false);
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");
  const [syncPhase, setSyncPhase] = useState<SyncPhase>("idle");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const previousThreadTargetsKeyRef = useRef<string>("");
  const syncRequestIdRef = useRef(0);
  const openRef = useRef(open);
  const channelsRef = useRef<Channel[]>([]);
  const syncInboxRef = useRef<(() => Promise<void>) | null>(null);
  const didBackgroundHydrateUserIdRef = useRef<string | null>(null);
  const fetchChannelsInFlightRef = useRef<Promise<ChannelRefreshResult> | null>(
    null,
  );
  const {
    fetchReservationThreadMetas,
    invalidateReservationThreadMetas,
    invalidateChatInboxListArchivedThreadIds,
  } = useModChatInvalidation();
  const sendMessageMutation = useMutReservationChatSendMessage();
  const sendGroupMessageMutation = useMutReservationGroupChatSendMessage();
  const archiveThreadMutation = useMutChatInboxArchiveThread();
  const unarchiveThreadMutation = useMutChatInboxUnarchiveThread();

  openRef.current = open;
  channelsRef.current = channels;

  const authQuery = useQueryChatAuth();
  const auth = authQuery.data;

  const {
    client,
    isReady,
    error: clientError,
  } = useModStreamClient(
    auth
      ? { apiKey: auth.apiKey, user: auth.user, tokenOrProvider: auth.token }
      : { apiKey: null, user: null, tokenOrProvider: null },
  );

  useEffect(() => {
    const storedOpen = readLocalStorage(config.storageKeys.open) === "1";
    const storedActive = readLocalStorage(
      config.storageKeys.activeReservationThreadId,
    );
    setOpen(storedOpen);
    if (storedActive?.startsWith("res-") || storedActive?.startsWith("grp-")) {
      setActiveThreadId(storedActive);
    } else if (storedActive) {
      setActiveThreadId(makeReservationThreadId(storedActive));
    } else {
      setActiveThreadId(null);
    }
  }, [config.storageKeys.activeReservationThreadId, config.storageKeys.open]);

  useEffect(() => {
    writeLocalStorage(config.storageKeys.open, open ? "1" : "0");
  }, [config.storageKeys.open, open]);

  useEffect(() => {
    if (activeThreadId) {
      writeLocalStorage(
        config.storageKeys.activeReservationThreadId,
        activeThreadId,
      );
    }
  }, [activeThreadId, config.storageKeys.activeReservationThreadId]);

  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ReservationChatOpenDetail>;
      const detail = customEvent.detail;
      if (!detail) {
        return;
      }

      if (detail.kind && detail.kind !== config.kind) {
        return;
      }

      if (detail.reservationGroupId) {
        setActiveThreadId(
          makeReservationGroupThreadId(detail.reservationGroupId),
        );
      } else if (detail.reservationId) {
        setActiveThreadId(makeReservationThreadId(detail.reservationId));
      } else {
        return;
      }

      setOpen(true);
      if (!isDesktop) {
        setMobilePane("thread");
      }
    };

    window.addEventListener(RESERVATION_CHAT_OPEN_EVENT, handleOpenEvent);
    return () => {
      window.removeEventListener(RESERVATION_CHAT_OPEN_EVENT, handleOpenEvent);
    };
  }, [config.kind, isDesktop]);

  const fetchChannels = useRef<(() => Promise<ChannelRefreshResult>) | null>(
    null,
  );
  fetchChannels.current = async () => {
    if (!isReady || !client || !auth?.user.id) {
      return {
        ok: false,
        channels: [],
        error: new Error("Chat client is not ready"),
      };
    }

    if (fetchChannelsInFlightRef.current) {
      return fetchChannelsInFlightRef.current;
    }

    const request = (async (): Promise<ChannelRefreshResult> => {
      setIsLoadingChannels(true);
      setChannelsError(null);
      try {
        const results = await client.queryChannels(
          {
            type: "messaging",
            members: { $in: [auth.user.id] },
          } as unknown as Record<string, unknown>,
          { last_message_at: -1 },
          { limit: 30, message_limit: 1 },
        );
        setChannels(results);
        return { ok: true, channels: results };
      } catch (error) {
        setChannelsError(error);
        return { ok: false, channels: [], error };
      } finally {
        setIsLoadingChannels(false);
        setHasLoadedChannelsOnce(true);
      }
    })();

    fetchChannelsInFlightRef.current = request;
    try {
      return await request;
    } finally {
      if (fetchChannelsInFlightRef.current === request) {
        fetchChannelsInFlightRef.current = null;
      }
    }
  };

  const syncInbox = useCallback(async () => {
    const requestId = ++syncRequestIdRef.current;
    setSyncPhase("syncing");
    setSyncErrorMessage(null);

    const refreshChannels = fetchChannels.current;
    const streamResult = refreshChannels
      ? await refreshChannels()
      : {
          ok: false,
          channels: [],
          error: new Error("Unable to refresh conversations"),
        };

    const threadTargets = toReservationThreadTargetsFromThreadIds(
      (streamResult.ok ? streamResult.channels : channelsRef.current).map(
        (channel) => channel.id,
      ),
    );

    const shouldRefreshMetas =
      open &&
      (threadTargets.reservationIds.length > 0 ||
        threadTargets.reservationGroupIds.length > 0);
    let metaError: unknown = null;
    if (shouldRefreshMetas) {
      try {
        await invalidateReservationThreadMetas({
          reservationIds: threadTargets.reservationIds,
          reservationGroupIds: threadTargets.reservationGroupIds,
        });
        await fetchReservationThreadMetas({
          reservationIds: threadTargets.reservationIds,
          reservationGroupIds: threadTargets.reservationGroupIds,
        });
      } catch (error) {
        metaError = error;
      }
    }

    if (requestId !== syncRequestIdRef.current) {
      return;
    }

    const metaOk = !shouldRefreshMetas || metaError === null;
    if (streamResult.ok && metaOk) {
      setSyncPhase("idle");
      setSyncErrorMessage(null);
      return;
    }

    if (!streamResult.ok && (!metaOk || !shouldRefreshMetas)) {
      setSyncPhase("error");
      setSyncErrorMessage(
        shouldRefreshMetas
          ? "Failed to refresh conversations and reservation state."
          : "Failed to refresh conversations.",
      );
      return;
    }

    setSyncPhase("partial");
    setSyncErrorMessage(
      streamResult.ok
        ? "Messages refreshed, but reservation state may still be stale."
        : "Reservation state refreshed, but messages may still be stale.",
    );
  }, [fetchReservationThreadMetas, invalidateReservationThreadMetas, open]);
  syncInboxRef.current = syncInbox;

  useEffect(() => {
    if (!auth?.user.id) {
      didBackgroundHydrateUserIdRef.current = null;
      return;
    }

    if (!isReady || !client) {
      return;
    }

    if (didBackgroundHydrateUserIdRef.current === auth.user.id) {
      return;
    }

    didBackgroundHydrateUserIdRef.current = auth.user.id;
    fetchChannels.current?.().catch(() => undefined);
  }, [auth?.user.id, client, isReady]);

  useEffect(() => {
    if (!open || !isReady || !client || !auth?.user.id) {
      return;
    }
    syncInbox().catch(() => undefined);
  }, [auth?.user.id, client, isReady, open, syncInbox]);

  useEffect(() => {
    if (!isReady || !client) {
      return;
    }

    const subscription = client.on((event: { type?: string }) => {
      const shouldRefresh =
        event.type === "message.new" ||
        event.type === "notification.message_new" ||
        event.type === "notification.added_to_channel";

      if (!shouldRefresh) {
        return;
      }

      if (openRef.current) {
        syncInboxRef.current?.().catch(() => undefined);
        return;
      }

      fetchChannels.current?.().catch(() => undefined);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, isReady]);

  const reservationChannels = useMemo(
    () =>
      channels.filter((channel) => {
        const channelId = channel.id;
        return (
          typeof channelId === "string" &&
          (!!parseReservationThreadId(channelId) ||
            !!parseReservationGroupThreadId(channelId))
        );
      }),
    [channels],
  );

  const unreadByThreadId = useMemo(() => {
    const map = new Map<string, number>();
    for (const channel of reservationChannels) {
      const channelId = channel.id;
      if (!channelId) {
        continue;
      }

      if (
        !parseReservationThreadId(channelId) &&
        !parseReservationGroupThreadId(channelId)
      ) {
        continue;
      }

      map.set(channelId, channel.state.unreadCount ?? 0);
    }
    return map;
  }, [reservationChannels]);

  const channelActivityMsByThreadId = useMemo(() => {
    const map = new Map<string, number>();
    for (const channel of reservationChannels) {
      const channelId = channel.id;
      if (!channelId) {
        continue;
      }

      if (
        !parseReservationThreadId(channelId) &&
        !parseReservationGroupThreadId(channelId)
      ) {
        continue;
      }

      const latestMessage = channel.state.latestMessages?.[0];
      const stateRecord = channel.state as unknown as Record<string, unknown>;
      const dataRecord = (channel.data ?? {}) as Record<string, unknown>;
      const ms = Math.max(
        parseTimestampMs(latestMessage?.updated_at),
        parseTimestampMs(latestMessage?.created_at),
        parseTimestampMs(stateRecord.last_message_at),
        parseTimestampMs(dataRecord.last_message_at),
      );

      map.set(channelId, ms);
    }
    return map;
  }, [reservationChannels]);

  const threadIds = useMemo(
    () =>
      reservationChannels
        .map((channel) => channel.id)
        .filter((id): id is string => typeof id === "string"),
    [reservationChannels],
  );

  const threadTargets = useMemo(
    () => toReservationThreadTargetsFromThreadIds(threadIds),
    [threadIds],
  );

  const threadTargetsKey = useMemo(
    () =>
      `res:${threadTargets.reservationIds.join(",")}|grp:${threadTargets.reservationGroupIds.join(",")}`,
    [threadTargets.reservationGroupIds, threadTargets.reservationIds],
  );

  const metasQuery = useQueryReservationChatThreadMetas(
    {
      reservationIds: threadTargets.reservationIds,
      reservationGroupIds: threadTargets.reservationGroupIds,
      includeArchived: false,
    },
    {
      enabled:
        threadTargets.reservationIds.length > 0 ||
        threadTargets.reservationGroupIds.length > 0,
      placeholderData: (prev) => prev,
    },
  );

  const archivedThreadIdsQuery = useQueryChatInboxListArchivedThreadIds(
    { threadKind: "reservation" },
    {
      enabled: open,
    },
  );

  const archivedThreadTargetsFromStore = useMemo(() => {
    return toReservationThreadTargetsFromThreadIds(
      archivedThreadIdsQuery.data?.threadIds ?? [],
    );
  }, [archivedThreadIdsQuery.data?.threadIds]);

  const archivedMetasQuery = useQueryReservationChatThreadMetas(
    {
      reservationIds: archivedThreadTargetsFromStore.reservationIds,
      reservationGroupIds: archivedThreadTargetsFromStore.reservationGroupIds,
      includeArchived: true,
    },
    {
      enabled:
        open &&
        (archivedThreadTargetsFromStore.reservationIds.length > 0 ||
          archivedThreadTargetsFromStore.reservationGroupIds.length > 0),
      placeholderData: (prev) => prev,
    },
  );

  const activeThreadFallbackMetasQuery = useQueryReservationChatThreadMetas(
    {
      reservationIds:
        activeThreadId && parseReservationThreadId(activeThreadId)
          ? [parseReservationThreadId(activeThreadId)?.reservationId ?? ""]
          : [],
      reservationGroupIds:
        activeThreadId && parseReservationGroupThreadId(activeThreadId)
          ? [
              parseReservationGroupThreadId(activeThreadId)
                ?.reservationGroupId ?? "",
            ]
          : [],
      includeArchived: true,
    },
    {
      enabled:
        open &&
        Boolean(activeThreadId) &&
        !metasQuery.data?.some((meta) => meta.threadId === activeThreadId),
      placeholderData: (prev) => prev,
    },
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (previousThreadTargetsKeyRef.current !== threadTargetsKey) {
      setHasLoadedMetasOnce(false);
      previousThreadTargetsKeyRef.current = threadTargetsKey;
    }
  }, [open, threadTargetsKey]);

  useEffect(() => {
    if (!open || threadIds.length === 0) {
      return;
    }

    if (metasQuery.isSuccess || metasQuery.isError) {
      setHasLoadedMetasOnce(true);
    }
  }, [metasQuery.isError, metasQuery.isSuccess, open, threadIds.length]);

  useEffect(() => {
    if (!open) {
      setHasLoadedChannelsOnce(false);
      setHasLoadedMetasOnce(false);
      setChannelsError(null);
      setSyncPhase("idle");
      setSyncErrorMessage(null);
      setMobilePane("list");
    }
  }, [open]);

  const metasByThreadId = useMemo(() => {
    const map = new Map<string, ReservationThreadMeta>();
    for (const meta of metasQuery.data ?? []) {
      map.set(meta.threadId, meta as ReservationThreadMeta);
    }
    return map;
  }, [metasQuery.data]);

  const archivedMetasByThreadId = useMemo(() => {
    const map = new Map<string, ReservationThreadMeta>();
    for (const meta of archivedMetasQuery.data ?? []) {
      map.set(meta.threadId, meta as ReservationThreadMeta);
    }
    return map;
  }, [archivedMetasQuery.data]);

  const activeFallbackMetaByThreadId = useMemo(() => {
    const map = new Map<string, ReservationThreadMeta>();
    for (const meta of activeThreadFallbackMetasQuery.data ?? []) {
      map.set(meta.threadId, meta as ReservationThreadMeta);
    }
    return map;
  }, [activeThreadFallbackMetasQuery.data]);

  const showSyncWarning = syncPhase === "partial" || syncPhase === "error";
  const isRefreshBusy = isManualRefreshing;
  const showMetaSkeletons = threadIds.length > 0 && !hasLoadedMetasOnce;

  const isStreamConnecting =
    open && authQuery.isSuccess && !clientError && !isReady;
  const isInitialLoading =
    open &&
    (authQuery.isLoading ||
      isStreamConnecting ||
      (!hasLoadedChannelsOnce && !channelsError) ||
      (threadIds.length > 0 && !hasLoadedMetasOnce));

  const sortedThreadIds = useMemo(
    () =>
      sortReservationInboxIds({
        reservationIds: threadIds,
        metasByReservationId: metasByThreadId,
        unreadByReservationId: unreadByThreadId,
        channelActivityMsByReservationId: channelActivityMsByThreadId,
      }),
    [channelActivityMsByThreadId, metasByThreadId, threadIds, unreadByThreadId],
  );

  const visibleThreadIds = useMemo(
    () => sortedThreadIds.filter((threadId) => metasByThreadId.has(threadId)),
    [metasByThreadId, sortedThreadIds],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (activeThreadId) {
      return;
    }

    const first = visibleThreadIds[0] ?? null;
    if (first) {
      setActiveThreadId(first);
    }
  }, [activeThreadId, open, visibleThreadIds]);

  const activeMeta = useMemo(() => {
    if (!activeThreadId) {
      return null;
    }
    return (
      metasByThreadId.get(activeThreadId) ??
      activeFallbackMetaByThreadId.get(activeThreadId) ??
      null
    );
  }, [activeFallbackMetaByThreadId, activeThreadId, metasByThreadId]);

  const activeChannelId = activeThreadId;

  const activeChannel = useMemo(() => {
    if (!activeChannelId) {
      return null;
    }
    return reservationChannels.find((c) => c.id === activeChannelId) ?? null;
  }, [activeChannelId, reservationChannels]);

  const unreadCount = useMemo(() => {
    return sumReservationUnreadCounts({
      reservationIds: visibleThreadIds,
      unreadByReservationId: unreadByThreadId,
    });
  }, [unreadByThreadId, visibleThreadIds]);

  const myUserId = auth?.user.id ?? null;
  const now = new Date();
  const readOnly = isReservationMetaArchived(activeMeta, now);
  const readOnlyReason = getReservationReadOnlyReason(activeMeta, now);
  const activeChannelThreadId = activeChannel?.id ?? null;
  const archivedThreadIds = archivedThreadIdsQuery.data?.threadIds ?? [];
  const activeThreadIsArchived =
    !!activeChannelThreadId &&
    archivedThreadIds.includes(activeChannelThreadId);

  const handleArchiveThread = useCallback(async () => {
    if (!activeChannelThreadId) {
      return;
    }

    await archiveThreadMutation.mutateAsync({
      threadKind: "reservation",
      threadId: activeChannelThreadId,
    });
    await Promise.all([
      invalidateChatInboxListArchivedThreadIds({ threadKind: "reservation" }),
      invalidateReservationThreadMetas({
        reservationIds: threadTargets.reservationIds,
        reservationGroupIds: threadTargets.reservationGroupIds,
      }),
    ]);
  }, [
    activeChannelThreadId,
    archiveThreadMutation,
    invalidateChatInboxListArchivedThreadIds,
    invalidateReservationThreadMetas,
    threadTargets.reservationGroupIds,
    threadTargets.reservationIds,
  ]);

  const handleUnarchiveThread = useCallback(
    async (threadId?: string) => {
      const targetThreadId = threadId ?? activeChannelThreadId;
      if (!targetThreadId) {
        return;
      }

      await unarchiveThreadMutation.mutateAsync({
        threadKind: "reservation",
        threadId: targetThreadId,
      });
      await Promise.all([
        invalidateChatInboxListArchivedThreadIds({ threadKind: "reservation" }),
        invalidateReservationThreadMetas({
          reservationIds: threadTargets.reservationIds,
          reservationGroupIds: threadTargets.reservationGroupIds,
        }),
      ]);
    },
    [
      activeChannelThreadId,
      invalidateChatInboxListArchivedThreadIds,
      invalidateReservationThreadMetas,
      threadTargets.reservationGroupIds,
      threadTargets.reservationIds,
      unarchiveThreadMutation,
    ],
  );

  const archivedReservationItems = useMemo(() => {
    return (archivedThreadIdsQuery.data?.threadIds ?? []).map((threadId) => ({
      threadId,
      meta: archivedMetasByThreadId.get(threadId) ?? null,
    }));
  }, [archivedMetasByThreadId, archivedThreadIdsQuery.data?.threadIds]);

  const renderListRow = (threadId: string) => {
    const meta = metasByThreadId.get(threadId) ?? null;
    const channel =
      reservationChannels.find((channelItem) => channelItem.id === threadId) ??
      null;
    const unread = channel?.state.unreadCount ?? 0;
    const lastMessage = channel?.state.latestMessages?.[0]?.text ?? "";

    const start = meta ? new Date(meta.startTimeIso) : null;
    const end = meta ? new Date(meta.endTimeIso) : null;
    const ongoing = start && end ? now >= start && now <= end : false;
    const action = meta?.status === "AWAITING_PAYMENT";

    const isActive = threadId === activeThreadId;
    const fallbackId =
      meta?.reservationGroupId ?? meta?.reservationId ?? threadId;

    const primary = meta
      ? (config.labels.listPrimary(meta, threadId) ??
        `Reservation ${fallbackId.slice(0, 8).toUpperCase()}`)
      : showMetaSkeletons
        ? null
        : `Reservation ${fallbackId.slice(0, 8).toUpperCase()}`;
    const secondary = config.labels.listSecondary(meta);

    return (
      <button
        key={threadId}
        type="button"
        className={cn(
          "w-full text-left px-4 py-3 transition-colors",
          isActive ? "bg-muted" : "hover:bg-muted/60",
          ongoing && !isActive && "bg-primary/5",
        )}
        onClick={() => {
          setActiveThreadId(threadId);
          if (!isDesktop) {
            setMobilePane("thread");
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {ongoing ? (
                <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
              ) : action ? (
                <span className="inline-flex h-2 w-2 rounded-full bg-warning" />
              ) : null}

              {meta ? (
                <StatusPill status={meta.status} />
              ) : showMetaSkeletons ? (
                <Skeleton className="h-5 w-16 rounded-full" />
              ) : null}

              {primary ? (
                <div className="truncate text-sm font-medium">{primary}</div>
              ) : (
                <Skeleton className="h-4 w-40" />
              )}
            </div>

            {meta ? (
              <div className="truncate text-xs text-muted-foreground mt-0.5">
                {secondary
                  ? secondary
                  : `${meta.courtLabel} • ${formatInTimeZone(
                      meta.startTimeIso,
                      meta.timeZone,
                      "EEE MMM d",
                    )} • ${formatTimeRangeInTimeZone(
                      meta.startTimeIso,
                      meta.endTimeIso,
                      meta.timeZone,
                    )}`}
              </div>
            ) : showMetaSkeletons ? (
              <Skeleton className="mt-1 h-3 w-56" />
            ) : (
              <div className="truncate text-xs text-muted-foreground mt-0.5">
                {lastMessage || "No messages yet"}
              </div>
            )}
          </div>

          {unread > 0 ? (
            <Badge className="h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
              {unread > 99 ? "99+" : unread}
            </Badge>
          ) : null}
        </div>
      </button>
    );
  };

  const listPane = (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col",
        isDesktop && "w-[360px] flex-none",
      )}
    >
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Dialog
            open={archivedDialogOpen}
            onOpenChange={setArchivedDialogOpen}
          >
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                Archived ({archivedReservationItems.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Archived reservation threads</DialogTitle>
                <DialogDescription>
                  Manually unarchive a thread to make it eligible for the inbox
                  again.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[420px] pr-2">
                <div className="space-y-2">
                  {archivedReservationItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No archived reservation threads.
                    </div>
                  ) : (
                    archivedReservationItems.map((item) => {
                      const fallbackId =
                        item.meta?.reservationGroupId ??
                        item.meta?.reservationId ??
                        item.threadId;
                      const primary = item.meta
                        ? (config.labels.listPrimary(
                            item.meta,
                            item.threadId,
                          ) ??
                          `Reservation ${fallbackId.slice(0, 8).toUpperCase()}`)
                        : `Reservation ${fallbackId.slice(0, 8).toUpperCase()}`;

                      return (
                        <div
                          key={item.threadId}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {primary}
                            </p>
                            {item.meta ? (
                              <p className="truncate text-xs text-muted-foreground">
                                {item.meta.courtLabel} •{" "}
                                {formatInTimeZone(
                                  item.meta.startTimeIso,
                                  item.meta.timeZone,
                                  "EEE MMM d",
                                )}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={unarchiveThreadMutation.isPending}
                            onClick={() =>
                              handleUnarchiveThread(item.threadId).catch(
                                () => undefined,
                              )
                            }
                          >
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Unarchive
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            disabled={isRefreshBusy}
            onClick={() => {
              setIsManualRefreshing(true);
              syncInbox()
                .catch(() => undefined)
                .finally(() => setIsManualRefreshing(false));
            }}
          >
            <RefreshCw
              className={cn("h-4 w-4", isRefreshBusy && "animate-spin")}
            />
            <span className="sr-only">Refresh inbox</span>
          </Button>
        </div>
      </div>

      {showSyncWarning && syncErrorMessage ? (
        <div
          className={cn(
            "border-b px-4 py-2 text-xs",
            syncPhase === "error" ? "text-destructive" : "text-warning",
          )}
        >
          {syncErrorMessage}
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1">
        <div className="divide-y">
          {isInitialLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : channelsError && reservationChannels.length === 0 ? (
            <div className="p-4 text-sm text-destructive">
              Failed to load conversations. Try refreshing.
            </div>
          ) : hasLoadedChannelsOnce && visibleThreadIds.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No reservation chats yet.
            </div>
          ) : (
            visibleThreadIds.map(renderListRow)
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const threadPane = (
    <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
      <StreamChatThread
        client={isReady ? client : null}
        channelId={activeChannel?.id ?? null}
        channelType={activeChannel?.type ?? "messaging"}
        members={null}
        myUserId={myUserId}
        headerStatus={activeMeta?.status}
        headerTitle={config.labels.threadTitle(activeMeta)}
        headerSubtitle={
          activeMeta
            ? `${activeMeta.reservationGroupId ? "GRP" : "RES"}-${(
                activeMeta.reservationGroupId ??
                activeMeta.reservationId ??
                "thread"
              )
                .slice(0, 8)
                .toUpperCase()} • ${formatInTimeZone(
                activeMeta.startTimeIso,
                activeMeta.timeZone,
                "EEE MMM d",
              )} • ${formatTimeRangeInTimeZone(
                activeMeta.startTimeIso,
                activeMeta.endTimeIso,
                activeMeta.timeZone,
              )}`
            : undefined
        }
        readOnly={readOnly}
        readOnlyReason={readOnlyReason ?? undefined}
        minHeightClassName="min-h-0 flex-1"
        onRefreshContext={async () => {
          setIsManualRefreshing(true);
          try {
            await syncInbox();
          } finally {
            setIsManualRefreshing(false);
          }
        }}
        isContextRefreshing={isManualRefreshing}
        archiveActionLabel={
          activeChannelThreadId
            ? activeThreadIsArchived
              ? "Unarchive"
              : "Archive"
            : undefined
        }
        onArchiveAction={
          activeChannelThreadId
            ? activeThreadIsArchived
              ? () => handleUnarchiveThread()
              : () => handleArchiveThread()
            : null
        }
        isArchiveActionBusy={
          archiveThreadMutation.isPending || unarchiveThreadMutation.isPending
        }
        onBack={!isDesktop ? () => setMobilePane("list") : undefined}
        backButtonLabel="Back to inbox"
        onSendMessage={async (payload) => {
          if (!activeThreadId) {
            throw new Error("Conversation not selected");
          }

          const parsedGroup = parseReservationGroupThreadId(activeThreadId);
          if (parsedGroup) {
            await sendGroupMessageMutation.mutateAsync({
              reservationGroupId: parsedGroup.reservationGroupId,
              text: payload.text,
              attachments: payload.attachments,
            });
            return;
          }

          const parsedReservation = parseReservationThreadId(activeThreadId);
          if (!parsedReservation) {
            throw new Error("Unsupported thread type");
          }

          await sendMessageMutation.mutateAsync({
            reservationId: parsedReservation.reservationId,
            text: payload.text,
            attachments: payload.attachments,
          });
        }}
      />
    </div>
  );

  return (
    <InboxFloatingSheet
      open={open}
      onOpenChange={setOpen}
      unreadCount={unreadCount}
      triggerLabel="Open messages"
      triggerVariant={config.kind === "owner" ? "secondary" : "default"}
      triggerClassName={cn(config.kind === "owner" && "border")}
      sheetTitle={config.ui.sheetTitle}
      sheetDescription={config.ui.sheetDescription}
      isSmall={isSmall}
      isDesktop={isDesktop}
      authLoading={authQuery.isLoading}
      authErrorMessage={authQuery.isError ? authQuery.error.message : null}
      clientErrorMessage={
        clientError
          ? clientError instanceof Error
            ? clientError.message
            : "Unable to connect to chat."
          : null
      }
      mobilePane={mobilePane}
      listPane={listPane}
      threadPane={threadPane}
    />
  );
}
