"use client";

import { ArchiveRestore, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatInTimeZone, formatTimeRangeInTimeZone } from "@/common/format";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { getPlayerReservationAbsoluteUrl } from "@/common/reservation-links";
import { copyToClipboard } from "@/common/utils/clipboard";
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
import { useModReservationSync } from "@/features/reservation/sync";
import {
  makeReservationGroupThreadId,
  makeReservationThreadId,
  parseReservationGroupThreadId,
  parseReservationThreadId,
} from "@/lib/modules/chat/shared/domain";
import { toReservationThreadTargetsFromThreadIds } from "@/lib/modules/chat/shared/transform";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import {
  getChatStatusBadgeClassName,
  getReservationReadOnlyReason,
  isReservationMetaArchived,
  sortReservationInboxIds,
  sumReservationUnreadCounts,
} from "../../domain";
import {
  useMutChatInboxArchiveThread,
  useMutChatInboxUnarchiveThread,
  useMutReservationChatSendMessage,
  useMutReservationGroupChatSendMessage,
  useQueryChatInboxListArchivedThreadIds,
  useQueryReservationChatThreadMetas,
} from "../../hooks/use-chat-trpc";
import { ChatThread } from "../chat-thread/chat-thread";
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

type InboxKind = "player" | "organization";
type SyncPhase = "idle" | "syncing" | "partial" | "error";

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
    listSecondary: (
      meta: ReservationThreadMeta | null,
      threadId: string,
    ) => string | null;
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

const STATUS_MICROCOPY: Record<string, string> = {
  CREATED: "Awaiting acceptance",
  AWAITING_PAYMENT: "Payment needed",
  PAYMENT_MARKED_BY_USER: "Payment under review",
  CONFIRMED: "Confirmed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

function getReservationReference(meta: ReservationThreadMeta): string {
  const prefix = meta.reservationGroupId ? "GRP" : "RES";
  const id =
    meta.reservationGroupId ?? meta.reservationId ?? meta.threadId ?? "thread";
  return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
}

export function ReservationInboxWidget({
  config,
}: {
  config: ReservationInboxWidgetConfig;
}) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isSmall = useMediaQuery("(min-width: 640px)");

  const [open, setOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");
  const [syncPhase, setSyncPhase] = useState<SyncPhase>("idle");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const utils = trpc.useUtils();
  const sendMessageMutation = useMutReservationChatSendMessage();
  const sendGroupMessageMutation = useMutReservationGroupChatSendMessage();
  const archiveThreadMutation = useMutChatInboxArchiveThread();
  const unarchiveThreadMutation = useMutChatInboxUnarchiveThread();
  const { syncReservationChatInbox } = useModReservationSync();

  // Supabase Auth session provides identity - no separate Stream auth needed
  const authQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });
  const myUserId = authQuery.data?.id ?? null;

  useEffect(() => {
    const storedActive = readLocalStorage(
      config.storageKeys.activeReservationThreadId,
    );
    if (storedActive?.startsWith("res-") || storedActive?.startsWith("grp-")) {
      setActiveThreadId(storedActive);
    } else if (storedActive) {
      setActiveThreadId(makeReservationThreadId(storedActive));
    } else {
      setActiveThreadId(null);
    }
  }, [config.storageKeys.activeReservationThreadId]);

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

  const reservationThreadSummariesQuery =
    trpc.chatMessage.listThreadSummaries.useQuery(
      { threadIdPrefix: "res-", limit: 30 },
      {
        enabled: open,
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
      },
    );
  const reservationGroupThreadSummariesQuery =
    trpc.chatMessage.listThreadSummaries.useQuery(
      { threadIdPrefix: "grp-", limit: 30 },
      {
        enabled: open,
        refetchInterval: 15_000,
        refetchOnWindowFocus: true,
      },
    );

  const summaryThreadIds = useMemo(() => {
    const merged = [
      ...(reservationThreadSummariesQuery.data?.threads ?? []),
      ...(reservationGroupThreadSummariesQuery.data?.threads ?? []),
    ];
    const deduped = new Map<string, number>();

    for (const thread of merged) {
      deduped.set(thread.threadId, new Date(thread.lastMessageAt).getTime());
    }

    return Array.from(deduped.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([threadId]) => threadId)
      .slice(0, 30);
  }, [
    reservationGroupThreadSummariesQuery.data?.threads,
    reservationThreadSummariesQuery.data?.threads,
  ]);

  const visibleThreadTargets = useMemo(
    () => toReservationThreadTargetsFromThreadIds(summaryThreadIds),
    [summaryThreadIds],
  );

  // Use reservation thread metas as the source of thread list
  const metasQuery = useQueryReservationChatThreadMetas(
    {
      reservationIds: visibleThreadTargets.reservationIds,
      reservationGroupIds: visibleThreadTargets.reservationGroupIds,
      includeArchived: false,
    },
    {
      enabled:
        open &&
        summaryThreadIds.length > 0 &&
        (visibleThreadTargets.reservationIds.length > 0 ||
          visibleThreadTargets.reservationGroupIds.length > 0),
      placeholderData: (prev) => prev,
    },
  );

  const threadIds = useMemo(
    () => (metasQuery.data ?? []).map((meta) => meta.threadId),
    [metasQuery.data],
  );

  // Unread counts via tRPC
  const unreadCountsQuery = trpc.chatMessage.getUnreadCounts.useQuery(
    { threadIds },
    {
      enabled: open && threadIds.length > 0,
      refetchInterval: 15_000,
      refetchOnWindowFocus: true,
      placeholderData: (prev) => prev,
    },
  );

  const unreadByThreadId = useMemo(() => {
    const map = new Map<string, number>();
    const counts = unreadCountsQuery.data?.unreadCounts ?? {};
    for (const [threadId, count] of Object.entries(counts)) {
      map.set(threadId, count);
    }
    return map;
  }, [unreadCountsQuery.data]);

  const archivedThreadIdsQuery = useQueryChatInboxListArchivedThreadIds(
    { threadKind: "reservation" },
    {
      enabled: open,
    },
  );

  const archivedThreadTargets = useMemo(
    () =>
      toReservationThreadTargetsFromThreadIds(
        archivedThreadIdsQuery.data?.threadIds ?? [],
      ),
    [archivedThreadIdsQuery.data?.threadIds],
  );

  const archivedMetasQuery = useQueryReservationChatThreadMetas(
    {
      reservationIds: archivedThreadTargets.reservationIds,
      reservationGroupIds: archivedThreadTargets.reservationGroupIds,
      includeArchived: true,
    },
    {
      enabled:
        open &&
        (archivedThreadTargets.reservationIds.length > 0 ||
          archivedThreadTargets.reservationGroupIds.length > 0),
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

  const isSummaryLoading =
    reservationThreadSummariesQuery.isLoading ||
    reservationGroupThreadSummariesQuery.isLoading;
  const isInitialLoading =
    open &&
    (isSummaryLoading ||
      (summaryThreadIds.length > 0 &&
        (metasQuery.isLoading || (!metasQuery.data && !metasQuery.isError))));

  const sortedThreadIds = useMemo(
    () =>
      sortReservationInboxIds({
        reservationIds: threadIds,
        metasByReservationId: metasByThreadId,
        unreadByReservationId: unreadByThreadId,
        channelActivityMsByReservationId: new Map(),
      }),
    [metasByThreadId, threadIds, unreadByThreadId],
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

  const unreadCount = useMemo(() => {
    return sumReservationUnreadCounts({
      reservationIds: visibleThreadIds,
      unreadByReservationId: unreadByThreadId,
    });
  }, [unreadByThreadId, visibleThreadIds]);

  const now = new Date();
  const readOnly = isReservationMetaArchived(activeMeta, now);
  const readOnlyReason = getReservationReadOnlyReason(activeMeta, now);
  const activeChannelThreadId = activeThreadId;
  const archivedThreadIds = archivedThreadIdsQuery.data?.threadIds ?? [];
  const activeThreadIsArchived =
    !!activeChannelThreadId &&
    archivedThreadIds.includes(activeChannelThreadId);
  const activeReservationReference = activeMeta
    ? getReservationReference(activeMeta)
    : null;
  const activeStatusMicrocopy = activeMeta
    ? (STATUS_MICROCOPY[activeMeta.status] ?? activeMeta.status)
    : null;

  const syncInbox = useCallback(async () => {
    setSyncPhase("syncing");
    setSyncErrorMessage(null);
    try {
      await syncReservationChatInbox(visibleThreadTargets.reservationIds, {
        visibleReservationIds: visibleThreadTargets.reservationIds,
        visibleReservationGroupIds: visibleThreadTargets.reservationGroupIds,
      });
      setSyncPhase("idle");
    } catch {
      setSyncPhase("error");
      setSyncErrorMessage("Failed to refresh conversations.");
    }
  }, [syncReservationChatInbox, visibleThreadTargets]);

  const handleArchiveThread = useCallback(async () => {
    if (!activeChannelThreadId) {
      return;
    }

    await archiveThreadMutation.mutateAsync({
      threadKind: "reservation",
      threadId: activeChannelThreadId,
    });
    await syncReservationChatInbox(visibleThreadTargets.reservationIds, {
      visibleReservationIds: visibleThreadTargets.reservationIds,
      visibleReservationGroupIds: visibleThreadTargets.reservationGroupIds,
      includeArchivedThreadIds: true,
    });
  }, [
    activeChannelThreadId,
    archiveThreadMutation,
    syncReservationChatInbox,
    visibleThreadTargets,
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
      await syncReservationChatInbox(visibleThreadTargets.reservationIds, {
        visibleReservationIds: visibleThreadTargets.reservationIds,
        visibleReservationGroupIds: visibleThreadTargets.reservationGroupIds,
        includeArchivedThreadIds: true,
      });
    },
    [
      activeChannelThreadId,
      syncReservationChatInbox,
      unarchiveThreadMutation,
      visibleThreadTargets,
    ],
  );

  const archivedReservationItems = useMemo(() => {
    return (archivedThreadIdsQuery.data?.threadIds ?? []).map((threadId) => ({
      threadId,
      meta: archivedMetasByThreadId.get(threadId) ?? null,
    }));
  }, [archivedMetasByThreadId, archivedThreadIdsQuery.data?.threadIds]);

  const handleCopyPlayerLink = useCallback(async () => {
    if (!activeMeta?.reservationId) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const playerUrl = getPlayerReservationAbsoluteUrl({
      reservationId: activeMeta.reservationId,
      status: activeMeta.status,
      origin: window.location.origin,
    });

    await copyToClipboard(
      playerUrl,
      config.kind === "organization" ? "Player booking link" : "Booking link",
    );
  }, [activeMeta, config.kind]);

  const threadContextContent = activeMeta ? (
    <section className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-medium text-foreground">Booking context</p>
        {activeMeta.reservationId ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            onClick={() => {
              handleCopyPlayerLink().catch(() => undefined);
            }}
          >
            {config.kind === "organization"
              ? "Copy player link"
              : "Copy booking link"}
          </Button>
        ) : null}
      </div>
      <p className="mt-1 text-muted-foreground">
        {activeMeta.placeName} • {activeMeta.courtLabel}
      </p>
      <p className="mt-1 text-muted-foreground">
        {formatInTimeZone(
          activeMeta.startTimeIso,
          activeMeta.timeZone,
          "EEE MMM d",
        )}{" "}
        •{" "}
        {formatTimeRangeInTimeZone(
          activeMeta.startTimeIso,
          activeMeta.endTimeIso,
          activeMeta.timeZone,
        )}
      </p>
      <p className="mt-1 text-muted-foreground">
        {config.kind === "organization" ? "Booked by" : "Venue"}:{" "}
        {config.kind === "organization"
          ? activeMeta.playerDisplayName
          : activeMeta.ownerDisplayName}
      </p>
      <p className="mt-1 text-muted-foreground">
        Status: {activeStatusMicrocopy} • Ref: {activeReservationReference}
      </p>
    </section>
  ) : null;

  const renderListRow = (threadId: string) => {
    const meta = metasByThreadId.get(threadId) ?? null;
    const unread = unreadByThreadId.get(threadId) ?? 0;

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
      : `Reservation ${fallbackId.slice(0, 8).toUpperCase()}`;
    const configuredSecondary = config.labels.listSecondary(meta, threadId);
    const secondary = meta
      ? [
          configuredSecondary,
          `${meta.courtLabel} • ${formatInTimeZone(
            meta.startTimeIso,
            meta.timeZone,
            "EEE MMM d",
          )} • ${formatTimeRangeInTimeZone(
            meta.startTimeIso,
            meta.endTimeIso,
            meta.timeZone,
          )}`,
          STATUS_MICROCOPY[meta.status] ?? meta.status,
          getReservationReference(meta),
        ]
          .filter((item): item is string => Boolean(item))
          .join(" • ")
      : configuredSecondary;

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

              {meta ? <StatusPill status={meta.status} /> : null}

              <div className="truncate text-sm font-medium">{primary}</div>
            </div>

            {secondary ? (
              <div className="truncate text-xs text-muted-foreground mt-0.5">
                {secondary}
              </div>
            ) : null}
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
          ) : visibleThreadIds.length === 0 ? (
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
      <ChatThread
        threadId={activeThreadId}
        myUserId={myUserId}
        headerStatus={activeMeta?.status}
        headerTitle={config.labels.threadTitle(activeMeta)}
        headerSubtitle={
          activeMeta
            ? `${activeMeta.placeName} • ${activeMeta.courtLabel} • ${formatInTimeZone(
                activeMeta.startTimeIso,
                activeMeta.timeZone,
                "EEE MMM d",
              )} • ${formatTimeRangeInTimeZone(
                activeMeta.startTimeIso,
                activeMeta.endTimeIso,
                activeMeta.timeZone,
              )} • ${activeReservationReference ?? "RES-THREAD"}`
            : undefined
        }
        contextContent={threadContextContent}
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
              attachments: payload.attachments?.map((a) => ({
                type: a.type,
                asset_url: a.url,
                title: a.filename,
                file_size: a.fileSize,
                mime_type: a.mimeType,
              })),
            });
            void utils.chatMessage.listThreadSummaries.invalidate();
            return;
          }

          const parsedReservation = parseReservationThreadId(activeThreadId);
          if (!parsedReservation) {
            throw new Error("Unsupported thread type");
          }

          await sendMessageMutation.mutateAsync({
            reservationId: parsedReservation.reservationId,
            text: payload.text,
            attachments: payload.attachments?.map((a) => ({
              type: a.type,
              asset_url: a.url,
              title: a.filename,
              file_size: a.fileSize,
              mime_type: a.mimeType,
            })),
          });
          void utils.chatMessage.listThreadSummaries.invalidate();
        }}
      />
    </div>
  );

  return (
    <InboxFloatingSheet
      open={open}
      onOpenChange={setOpen}
      unreadCount={unreadCount}
      triggerLabel={
        config.kind === "organization"
          ? "Open booking inbox"
          : "Open booking messages"
      }
      triggerVariant={config.kind === "organization" ? "secondary" : "default"}
      triggerClassName={cn(config.kind === "organization" && "border")}
      sheetTitle={config.ui.sheetTitle}
      sheetDescription={config.ui.sheetDescription}
      isSmall={isSmall}
      isDesktop={isDesktop}
      authLoading={authQuery.isLoading}
      authErrorMessage={authQuery.isError ? authQuery.error.message : null}
      clientErrorMessage={null}
      mobilePane={mobilePane}
      listPane={listPane}
      threadPane={threadPane}
    />
  );
}
