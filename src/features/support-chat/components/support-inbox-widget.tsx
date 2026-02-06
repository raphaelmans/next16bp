"use client";

import { ChevronDown, MessagesSquare, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Channel } from "stream-chat";
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
import { StreamChatThread } from "@/features/chat/components/chat-thread/stream-chat-thread";
import { useStreamClient } from "@/features/chat/hooks/useStreamClient";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

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

type SupportThreadKind = "claim" | "verification";

function getSupportKind(
  channelId: string | null | undefined,
): SupportThreadKind | null {
  const id = channelId ?? "";
  if (id.startsWith("cr-")) return "claim";
  if (id.startsWith("vr-")) return "verification";
  return null;
}

function formatThreadTitle(channelId: string): string {
  const kind = getSupportKind(channelId);
  const short = channelId
    .replace(/^cr-/, "")
    .replace(/^vr-/, "")
    .slice(0, 8)
    .toUpperCase();
  return kind === "claim"
    ? `Claim • CR-${short}`
    : `Verification • VR-${short}`;
}

export function SupportInboxWidget() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isSmall = useMediaQuery("(min-width: 640px)");

  const storageKeys = {
    open: "admin_support_inbox_open",
    activeChannelId: "admin_support_inbox_active_channel",
  } as const;

  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
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
    const storedOpen = readLocalStorage(storageKeys.open) === "1";
    const storedActive = readLocalStorage(storageKeys.activeChannelId);
    setOpen(storedOpen);
    setActiveChannelId(storedActive);
  }, [storageKeys.activeChannelId, storageKeys.open]);

  useEffect(() => {
    writeLocalStorage(storageKeys.open, open ? "1" : "0");
  }, [open, storageKeys.open]);

  useEffect(() => {
    if (activeChannelId) {
      writeLocalStorage(storageKeys.activeChannelId, activeChannelId);
    }
  }, [activeChannelId, storageKeys.activeChannelId]);

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
    await fetchChannels.current?.();
  };

  useEffect(() => {
    if (!open) return;
    fetchChannels.current?.().catch(() => undefined);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!isReady || !client || !auth?.user.id) return;
    fetchChannels.current?.().catch(() => undefined);
  }, [auth?.user.id, client, isReady, open]);

  useEffect(() => {
    if (!isReady || !client) return;
    const subscription = client.on((event) => {
      if (event.type === "message.new") {
        fetchChannels.current?.().catch(() => undefined);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [client, isReady]);

  const supportChannels = useMemo(
    () =>
      channels.filter((c) => {
        const id = c.id ?? "";
        return id.startsWith("cr-") || id.startsWith("vr-");
      }),
    [channels],
  );

  const filteredChannels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return supportChannels;
    return supportChannels.filter((c) => {
      const id = (c.id ?? "").toLowerCase();
      const last = (c.state.latestMessages?.[0]?.text ?? "").toLowerCase();
      return id.includes(q) || last.includes(q);
    });
  }, [query, supportChannels]);

  // simple archive: no formal state; just hide older channels with no recent message
  const now = new Date();
  const isArchived = useMemo(() => {
    return (channel: Channel) => {
      const last = channel.state.last_message_at;
      if (!last) return false;
      const lastDate = last instanceof Date ? last : new Date(String(last));
      const days = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      return days > 30;
    };
  }, [now]);

  const activeChannels = useMemo(
    () => filteredChannels.filter((c) => !isArchived(c)),
    [filteredChannels, isArchived],
  );
  const archivedChannels = useMemo(
    () => filteredChannels.filter((c) => isArchived(c)),
    [filteredChannels, isArchived],
  );

  useEffect(() => {
    if (!open) return;
    if (activeChannelId) return;
    const first = activeChannels[0] ?? archivedChannels[0] ?? null;
    if (first?.id) {
      setActiveChannelId(first.id);
    }
  }, [activeChannelId, activeChannels, archivedChannels, open]);

  const activeChannel = useMemo(() => {
    if (!activeChannelId) return null;
    return supportChannels.find((c) => c.id === activeChannelId) ?? null;
  }, [activeChannelId, supportChannels]);

  const unreadCount = useMemo(() => {
    return supportChannels.reduce(
      (sum, c) => sum + (c.state.unreadCount ?? 0),
      0,
    );
  }, [supportChannels]);

  const myUserId = auth?.user.id ?? null;

  const renderRow = (channel: Channel) => {
    const id = channel.id ?? "";
    const unread = channel.state.unreadCount ?? 0;
    const lastMessage = channel.state.latestMessages?.[0]?.text ?? "";
    const kind = getSupportKind(id);
    const isActive = id === activeChannelId;

    return (
      <button
        key={id}
        type="button"
        className={cn(
          "w-full text-left px-4 py-3 transition-colors",
          isActive ? "bg-muted" : "hover:bg-muted/60",
        )}
        onClick={() => setActiveChannelId(id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">
                {formatThreadTitle(id)}
              </p>
              {kind ? (
                <Badge
                  variant="secondary"
                  className="h-5 rounded-full px-2 text-[10px]"
                >
                  {kind === "claim" ? "CLAIM" : "VERIFY"}
                </Badge>
              ) : null}
            </div>
            <div className="truncate text-xs text-muted-foreground mt-0.5">
              {lastMessage || "No messages yet"}
            </div>
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
          variant="secondary"
          className={cn("relative h-12 w-12 rounded-full shadow-lg border")}
          onClick={() => setOpen(true)}
        >
          <MessagesSquare className="h-5 w-5" />
          <span className="sr-only">Open support messages</span>
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
              <SheetTitle className="font-heading">Support Inbox</SheetTitle>
              <SheetDescription className="text-xs">
                Conversations with owners about claims and verification.
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
                        placeholder="Search by id or message…"
                        className="pl-9"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      disabled={isLoadingChannels}
                      onClick={() => refreshInbox().catch(() => undefined)}
                    >
                      <RefreshCw
                        className={cn(
                          "h-4 w-4",
                          isLoadingChannels && "animate-spin",
                        )}
                      />
                      <span className="sr-only">Refresh inbox</span>
                    </Button>
                  </div>
                </div>

                <ScrollArea className={cn("h-[38vh]", isDesktop && "h-full")}>
                  <div className="divide-y">
                    {isLoadingChannels && supportChannels.length === 0 ? (
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : supportChannels.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground">
                        No support threads yet. Open a request’s chat to join
                        it.
                      </div>
                    ) : (
                      <>
                        {activeChannels.map(renderRow)}
                        {archivedChannels.length > 0 ? (
                          <Collapsible
                            open={archiveOpen}
                            onOpenChange={setArchiveOpen}
                          >
                            <CollapsibleTrigger asChild>
                              <button
                                type="button"
                                className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground hover:bg-muted/60"
                              >
                                <span>Archive ({archivedChannels.length})</span>
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
                                {archivedChannels.map(renderRow)}
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
                  headerTitle={
                    activeChannel?.id
                      ? formatThreadTitle(activeChannel.id)
                      : "Support chat"
                  }
                  headerSubtitle={
                    activeChannel?.id
                      ? getSupportKind(activeChannel.id) === "claim"
                        ? "Claim support"
                        : "Verification support"
                      : undefined
                  }
                  readOnly={!isReady}
                  readOnlyReason={!isReady ? "Connecting..." : undefined}
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
