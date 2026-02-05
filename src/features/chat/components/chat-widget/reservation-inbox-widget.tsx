"use client";

import { ChevronDown, MessagesSquare, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { useStreamClient } from "../../hooks/useStreamClient";
import { StreamChatThread } from "../chat-thread/stream-chat-thread";

export type ReservationThreadMeta = {
  reservationId: string;
  status: string;
  placeName: string;
  timeZone: string;
  courtLabel: string;
  playerDisplayName: string;
  ownerDisplayName: string;
  startTimeIso: string;
  endTimeIso: string;
};

type InboxKind = "player" | "owner";

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

function computePriority(meta: ReservationThreadMeta | null, now: Date) {
  if (!meta) {
    return 50;
  }

  const start = new Date(meta.startTimeIso);
  const end = new Date(meta.endTimeIso);
  const ongoing = now >= start && now <= end;
  const action = meta.status === "AWAITING_PAYMENT";
  const waiting =
    meta.status === "CREATED" || meta.status === "PAYMENT_MARKED_BY_USER";

  if (ongoing) return 0;
  if (action) return 1;
  if (waiting) return 2;
  if (meta.status === "CONFIRMED" && start > now) return 3;
  return 10;
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
  const [archiveOpen, setArchiveOpen] = useState(false);

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

  const fetchChannels = useRef<(() => Promise<void>) | null>(null);
  fetchChannels.current = async () => {
    if (!isReady || !client || !auth?.user.id) {
      return;
    }

    setIsLoadingChannels(true);
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
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const refreshInbox = async () => {
    await Promise.all([fetchChannels.current?.(), metasQuery.refetch()]);
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    fetchChannels.current?.().catch(() => undefined);
  }, [open]);

  useEffect(() => {
    if (!isReady || !client) {
      return;
    }

    const subscription = client.on((event) => {
      if (event.type === "message.new") {
        fetchChannels.current?.().catch(() => undefined);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client, isReady]);

  const reservationChannels = useMemo(
    () => channels.filter((c) => (c.id ?? "").startsWith("res-")),
    [channels],
  );

  const reservationIds = useMemo(() => {
    const ids = reservationChannels
      .map((c) => c.id)
      .filter(
        (id): id is string => typeof id === "string" && id.startsWith("res-"),
      )
      .map((id) => id.replace("res-", ""));
    return Array.from(new Set(ids)).sort();
  }, [reservationChannels]);

  const metasQuery = trpc.reservationChat.getThreadMetas.useQuery(
    { reservationIds },
    {
      enabled: open && reservationIds.length > 0,
      placeholderData: (prev) => prev,
    },
  );

  const metasByReservationId = useMemo(() => {
    const map = new Map<string, ReservationThreadMeta>();
    for (const meta of metasQuery.data ?? []) {
      map.set(meta.reservationId, meta as ReservationThreadMeta);
    }
    return map;
  }, [metasQuery.data]);

  const isMetaPending = metasQuery.isPending;
  const isMetaFetching = metasQuery.isFetching && !metasQuery.isPending;

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
    const now = new Date();
    return [...filteredReservationIds].sort((a, b) => {
      const aMeta = metasByReservationId.get(a) ?? null;
      const bMeta = metasByReservationId.get(b) ?? null;
      const aArchived = isArchived(aMeta, now);
      const bArchived = isArchived(bMeta, now);
      if (aArchived !== bArchived) {
        return aArchived ? 1 : -1;
      }

      if (aArchived && bArchived) {
        const aTime = aMeta ? new Date(aMeta.startTimeIso).getTime() : 0;
        const bTime = bMeta ? new Date(bMeta.startTimeIso).getTime() : 0;
        return bTime - aTime;
      }

      const aPriority = computePriority(aMeta, now);
      const bPriority = computePriority(bMeta, now);
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      const aTime = aMeta ? new Date(aMeta.startTimeIso).getTime() : 0;
      const bTime = bMeta ? new Date(bMeta.startTimeIso).getTime() : 0;
      return aTime - bTime;
    });
  }, [filteredReservationIds, metasByReservationId]);

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
      : !isMetaPending
        ? `Reservation ${reservationId.slice(0, 8).toUpperCase()}`
        : null;
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
        onClick={() => setActiveReservationId(reservationId)}
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
              ) : isMetaPending ? (
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
            ) : isMetaPending ? (
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          size="icon"
          variant={config.kind === "owner" ? "secondary" : "default"}
          className={cn(
            "relative h-12 w-12 rounded-full shadow-lg",
            config.kind === "owner" && "border",
          )}
          onClick={() => setOpen(true)}
        >
          <MessagesSquare className="h-5 w-5" />
          <span className="sr-only">Open messages</span>
          {unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>

        <SheetContent
          side={isSmall ? "right" : "bottom"}
          className={"flex h-[88vh] flex-col gap-0 p-0 sm:h-full sm:max-w-5xl"}
        >
          <div className="flex items-start justify-between border-b px-5 py-4">
            <div className="space-y-0.5">
              <SheetTitle className="font-heading">
                {config.ui.sheetTitle}
              </SheetTitle>
              <SheetDescription className="text-xs">
                {config.ui.sheetDescription}
              </SheetDescription>
            </div>
          </div>

          {authQuery.isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading chat…
            </div>
          ) : authQuery.isError ? (
            <div className="p-6 text-sm text-destructive">
              {authQuery.error.message}
            </div>
          ) : clientError ? (
            <div className="p-6 text-sm text-destructive">
              {clientError instanceof Error
                ? clientError.message
                : "Unable to connect to chat."}
            </div>
          ) : (
            <div
              className={cn("flex flex-1 flex-col", isDesktop && "flex-row")}
            >
              <div className={cn("w-full", isDesktop && "w-[360px]")}>
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
                      disabled={isLoadingChannels || isMetaFetching}
                      onClick={() => refreshInbox().catch(() => undefined)}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          (isLoadingChannels || isMetaFetching) &&
                            "animate-spin",
                        )}
                      />
                      <span className="sr-only">Refresh inbox</span>
                    </Button>
                  </div>
                </div>

                <ScrollArea className={cn("h-[38vh]", isDesktop && "h-full")}>
                  <div className="divide-y">
                    {isLoadingChannels && reservationIds.length === 0 ? (
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : activeReservationIds.length === 0 &&
                      archivedReservationIds.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No reservation chats yet.
                      </div>
                    ) : (
                      <>
                        {activeReservationIds.map(renderListRow)}

                        {archivedReservationIds.length > 0 ? (
                          <Collapsible
                            open={archiveOpen}
                            onOpenChange={setArchiveOpen}
                          >
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/60"
                              >
                                <span>
                                  Archive ({archivedReservationIds.length})
                                </span>
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

              {isDesktop ? <Separator orientation="vertical" /> : <Separator />}

              <div className="flex-1">
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
                />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
