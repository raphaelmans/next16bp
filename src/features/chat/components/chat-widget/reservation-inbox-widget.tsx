"use client";

import { ChevronDown, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Channel } from "stream-chat";
import { formatInTimeZone, formatTimeRangeInTimeZone } from "@/common/format";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { useStreamClient } from "../../hooks/useStreamClient";
import { StreamChatThread } from "../chat-thread/stream-chat-thread";
import { InboxFloatingSheet } from "../inbox-shell/inbox-floating-sheet";

export type ReservationThreadMeta = {
  reservationId: string;
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
  reservationId: string;
  kind?: InboxKind;
  source?: string;
};

const RESERVATION_CHAT_OPEN_EVENT = "reservation-chat:open";

function extractReservationIds(channels: Channel[]) {
  const ids = channels
    .map((channel) => channel.id)
    .filter(
      (channelId): channelId is string =>
        typeof channelId === "string" && channelId.startsWith("res-"),
    )
    .map((channelId) => channelId.replace("res-", ""));

  return Array.from(new Set(ids));
}

function parseTimestampMs(value: unknown): number {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  }

  if (typeof value === "string") {
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : 0;
  }

  return 0;
}

export interface ReservationInboxWidgetConfig {
  kind: InboxKind;
  storageKeys: {
    open: string;
    activeReservationId: string;
  };
  ui: {
    sheetTitle: string;
    sheetDescription: string;
    searchPlaceholder: string;
  };
  labels: {
    listPrimary: (
      meta: ReservationThreadMeta | null,
      reservationId: string,
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

function isArchived(meta: ReservationThreadMeta | null, now: Date) {
  if (!meta) {
    return false;
  }
  if (meta.status === "CANCELLED" || meta.status === "EXPIRED") {
    return true;
  }
  if (meta.status === "CONFIRMED") {
    return new Date(meta.endTimeIso) < now;
  }
  return false;
}

function makeReadOnlyReason(meta: ReservationThreadMeta | null, now: Date) {
  if (!meta) {
    return null;
  }

  if (meta.status === "CANCELLED") {
    return "Reservation cancelled. This conversation is archived and read-only.";
  }
  if (meta.status === "EXPIRED") {
    return "Reservation expired. This conversation is archived and read-only.";
  }
  if (meta.status === "CONFIRMED" && new Date(meta.endTimeIso) < now) {
    return "Reservation complete. This conversation is archived and read-only.";
  }

  return null;
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return null;
  }

  const className =
    status === "CONFIRMED"
      ? "bg-success/10 text-success border-success/20"
      : status === "CANCELLED" || status === "EXPIRED"
        ? "bg-destructive/10 text-destructive border-destructive/20"
        : "bg-warning/10 text-warning border-warning/20";

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
  const [activeReservationId, setActiveReservationId] = useState<string | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [channelsError, setChannelsError] = useState<unknown>(null);
  const [hasLoadedChannelsOnce, setHasLoadedChannelsOnce] = useState(false);
  const [hasLoadedMetasOnce, setHasLoadedMetasOnce] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");
  const [syncPhase, setSyncPhase] = useState<SyncPhase>("idle");
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const previousReservationIdsKeyRef = useRef<string>("");
  const syncRequestIdRef = useRef(0);
  const channelsRef = useRef<Channel[]>([]);
  const utils = trpc.useUtils();

  channelsRef.current = channels;

  const authQuery = trpc.chat.getAuth.useQuery();
  const auth = authQuery.data;

  const {
    client,
    isReady,
    error: clientError,
  } = useStreamClient(
    auth
      ? { apiKey: auth.apiKey, user: auth.user, tokenOrProvider: auth.token }
      : { apiKey: null, user: null, tokenOrProvider: null },
  );

  useEffect(() => {
    const storedOpen = readLocalStorage(config.storageKeys.open) === "1";
    const storedActive = readLocalStorage(
      config.storageKeys.activeReservationId,
    );
    setOpen(storedOpen);
    setActiveReservationId(storedActive);
  }, [config.storageKeys.activeReservationId, config.storageKeys.open]);

  useEffect(() => {
    writeLocalStorage(config.storageKeys.open, open ? "1" : "0");
  }, [config.storageKeys.open, open]);

  useEffect(() => {
    if (activeReservationId) {
      writeLocalStorage(
        config.storageKeys.activeReservationId,
        activeReservationId,
      );
    }
  }, [activeReservationId, config.storageKeys.activeReservationId]);

  useEffect(() => {
    const handleOpenEvent = (event: Event) => {
      const customEvent = event as CustomEvent<ReservationChatOpenDetail>;
      const detail = customEvent.detail;
      if (!detail || !detail.reservationId) {
        return;
      }

      if (detail.kind && detail.kind !== config.kind) {
        return;
      }

      setActiveReservationId(detail.reservationId);
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

    const reservationIds = streamResult.ok
      ? extractReservationIds(streamResult.channels)
      : extractReservationIds(channelsRef.current);

    const shouldRefreshMetas = open && reservationIds.length > 0;
    let metaError: unknown = null;
    if (shouldRefreshMetas) {
      try {
        await utils.reservationChat.getThreadMetas.invalidate({
          reservationIds,
        });
        await utils.reservationChat.getThreadMetas.fetch({ reservationIds });
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
  }, [open, utils]);

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

    const subscription = client.on((event) => {
      if (event.type === "message.new") {
        if (open) {
          syncInbox().catch(() => undefined);
          return;
        }

        fetchChannels.current?.().catch(() => undefined);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, isReady, open, syncInbox]);

  const reservationChannels = useMemo(
    () => channels.filter((c) => (c.id ?? "").startsWith("res-")),
    [channels],
  );

  const unreadByReservationId = useMemo(() => {
    const map = new Map<string, number>();
    for (const channel of reservationChannels) {
      const channelId = channel.id;
      if (!channelId || !channelId.startsWith("res-")) {
        continue;
      }
      map.set(channelId.replace("res-", ""), channel.state.unreadCount ?? 0);
    }
    return map;
  }, [reservationChannels]);

  const channelActivityMsByReservationId = useMemo(() => {
    const map = new Map<string, number>();
    for (const channel of reservationChannels) {
      const channelId = channel.id;
      if (!channelId || !channelId.startsWith("res-")) {
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

      map.set(channelId.replace("res-", ""), ms);
    }
    return map;
  }, [reservationChannels]);

  const reservationIds = useMemo(
    () => extractReservationIds(reservationChannels),
    [reservationChannels],
  );

  const reservationIdsKey = useMemo(
    () => reservationIds.join(","),
    [reservationIds],
  );

  const metasQuery = trpc.reservationChat.getThreadMetas.useQuery(
    { reservationIds },
    {
      enabled: open && reservationIds.length > 0,
      placeholderData: (prev) => prev,
    },
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (previousReservationIdsKeyRef.current !== reservationIdsKey) {
      setHasLoadedMetasOnce(false);
      previousReservationIdsKeyRef.current = reservationIdsKey;
    }
  }, [open, reservationIdsKey]);

  useEffect(() => {
    if (!open || reservationIds.length === 0) {
      return;
    }

    if (metasQuery.isSuccess || metasQuery.isError) {
      setHasLoadedMetasOnce(true);
    }
  }, [metasQuery.isError, metasQuery.isSuccess, open, reservationIds.length]);

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

  const metasByReservationId = useMemo(() => {
    const map = new Map<string, ReservationThreadMeta>();
    for (const meta of metasQuery.data ?? []) {
      map.set(meta.reservationId, meta as ReservationThreadMeta);
    }
    return map;
  }, [metasQuery.data]);

  const isMetaFetching = metasQuery.isFetching && !metasQuery.isPending;
  const isSyncing = syncPhase === "syncing";
  const showSyncWarning = syncPhase === "partial" || syncPhase === "error";
  const isRefreshBusy = isSyncing || isLoadingChannels || isMetaFetching;
  const showMetaSkeletons = reservationIds.length > 0 && !hasLoadedMetasOnce;

  const isStreamConnecting =
    open && authQuery.isSuccess && !clientError && !isReady;
  const isInitialLoading =
    open &&
    (authQuery.isLoading ||
      isStreamConnecting ||
      (!hasLoadedChannelsOnce && !channelsError) ||
      (reservationIds.length > 0 && !hasLoadedMetasOnce));

  const filteredReservationIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return reservationIds;
    }

    return reservationIds.filter((reservationId) => {
      const meta = metasByReservationId.get(reservationId) ?? null;
      if (!meta) {
        return reservationId.toLowerCase().includes(q);
      }
      return (
        meta.placeName.toLowerCase().includes(q) ||
        meta.courtLabel.toLowerCase().includes(q)
      );
    });
  }, [metasByReservationId, query, reservationIds]);

  const sortedReservationIds = useMemo(() => {
    return [...filteredReservationIds].sort((a, b) => {
      const aMeta = metasByReservationId.get(a) ?? null;
      const bMeta = metasByReservationId.get(b) ?? null;

      const aActivityMs = Math.max(
        channelActivityMsByReservationId.get(a) ?? 0,
        parseTimestampMs(aMeta?.updatedAtIso),
      );
      const bActivityMs = Math.max(
        channelActivityMsByReservationId.get(b) ?? 0,
        parseTimestampMs(bMeta?.updatedAtIso),
      );

      if (aActivityMs !== bActivityMs) {
        return bActivityMs - aActivityMs;
      }

      const aUnread = unreadByReservationId.get(a) ?? 0;
      const bUnread = unreadByReservationId.get(b) ?? 0;
      if (aUnread !== bUnread) {
        return bUnread - aUnread;
      }

      const aStartMs = parseTimestampMs(aMeta?.startTimeIso);
      const bStartMs = parseTimestampMs(bMeta?.startTimeIso);
      if (aStartMs !== bStartMs) {
        return bStartMs - aStartMs;
      }

      return a.localeCompare(b);
    });
  }, [
    channelActivityMsByReservationId,
    filteredReservationIds,
    metasByReservationId,
    unreadByReservationId,
  ]);

  const activeReservationIds = useMemo(() => {
    const now = new Date();
    return sortedReservationIds.filter(
      (id) => !isArchived(metasByReservationId.get(id) ?? null, now),
    );
  }, [metasByReservationId, sortedReservationIds]);

  const archivedReservationIds = useMemo(() => {
    const now = new Date();
    return sortedReservationIds.filter((id) =>
      isArchived(metasByReservationId.get(id) ?? null, now),
    );
  }, [metasByReservationId, sortedReservationIds]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (activeReservationId) {
      return;
    }

    const first = activeReservationIds[0] ?? archivedReservationIds[0] ?? null;
    if (first) {
      setActiveReservationId(first);
    }
  }, [activeReservationId, activeReservationIds, archivedReservationIds, open]);

  const activeMeta = useMemo(() => {
    if (!activeReservationId) {
      return null;
    }
    return metasByReservationId.get(activeReservationId) ?? null;
  }, [activeReservationId, metasByReservationId]);

  const activeChannelId = activeReservationId
    ? `res-${activeReservationId}`
    : null;

  const activeChannel = useMemo(() => {
    if (!activeChannelId) {
      return null;
    }
    return reservationChannels.find((c) => c.id === activeChannelId) ?? null;
  }, [activeChannelId, reservationChannels]);

  const unreadCount = useMemo(() => {
    return reservationChannels.reduce(
      (sum, c) => sum + (c.state.unreadCount ?? 0),
      0,
    );
  }, [reservationChannels]);

  const myUserId = auth?.user.id ?? null;
  const now = new Date();
  const readOnly = isArchived(activeMeta, now);
  const readOnlyReason = makeReadOnlyReason(activeMeta, now);

  const renderListRow = (reservationId: string) => {
    const meta = metasByReservationId.get(reservationId) ?? null;
    const channel = reservationChannels.find(
      (c) => c.id === `res-${reservationId}`,
    );
    const unread = channel?.state.unreadCount ?? 0;
    const lastMessage = channel?.state.latestMessages?.[0]?.text ?? "";

    const start = meta ? new Date(meta.startTimeIso) : null;
    const end = meta ? new Date(meta.endTimeIso) : null;
    const ongoing = start && end ? now >= start && now <= end : false;
    const action = meta?.status === "AWAITING_PAYMENT";

    const isActive = reservationId === activeReservationId;

    const primary = meta
      ? (config.labels.listPrimary(meta, reservationId) ??
        `Reservation ${reservationId.slice(0, 8).toUpperCase()}`)
      : showMetaSkeletons
        ? null
        : `Reservation ${reservationId.slice(0, 8).toUpperCase()}`;
    const secondary = config.labels.listSecondary(meta);

    return (
      <button
        key={reservationId}
        type="button"
        className={cn(
          "w-full text-left px-4 py-3 transition-colors",
          isActive ? "bg-muted" : "hover:bg-muted/60",
          ongoing && !isActive && "bg-primary/5",
        )}
        onClick={() => {
          setActiveReservationId(reservationId);
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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={config.ui.searchPlaceholder}
              className="pl-9"
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            disabled={isRefreshBusy}
            onClick={() => syncInbox().catch(() => undefined)}
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
          ) : hasLoadedChannelsOnce &&
            activeReservationIds.length === 0 &&
            archivedReservationIds.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No reservation chats yet.
            </div>
          ) : (
            <>
              {activeReservationIds.map(renderListRow)}

              {archivedReservationIds.length > 0 ? (
                <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/60"
                    >
                      <span>Archive ({archivedReservationIds.length})</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          archiveOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="divide-y">
                      {archivedReservationIds.map(renderListRow)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const threadPane = (
    <div className="min-h-0 flex-1">
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
            ? `RES-${activeMeta.reservationId.slice(0, 8).toUpperCase()} • ${formatInTimeZone(
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
        onRefreshContext={syncInbox}
        isContextRefreshing={isSyncing}
        onBack={!isDesktop ? () => setMobilePane("list") : undefined}
        backButtonLabel="Back to inbox"
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
