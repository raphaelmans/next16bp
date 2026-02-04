"use client";

import { MessagesSquare, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Channel } from "stream-chat";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { useStreamClient } from "../../hooks/useStreamClient";
import { StreamChatThread } from "../chat-thread/stream-chat-thread";

const OWNER_CHAT_OPEN_KEY = "owner:chat:open";
const OWNER_CHAT_ACTIVE_KEY = "owner:chat:active";

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

export function OwnerChatWidget() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isSmall = useMediaQuery("(min-width: 640px)");

  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeCid, setActiveCid] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);

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
    const storedOpen = readLocalStorage(OWNER_CHAT_OPEN_KEY) === "1";
    const storedActive = readLocalStorage(OWNER_CHAT_ACTIVE_KEY);
    setOpen(storedOpen);
    setActiveCid(storedActive);
  }, []);

  useEffect(() => {
    writeLocalStorage(OWNER_CHAT_OPEN_KEY, open ? "1" : "0");
  }, [open]);

  useEffect(() => {
    if (activeCid) {
      writeLocalStorage(OWNER_CHAT_ACTIVE_KEY, activeCid);
    }
  }, [activeCid]);

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

      if (!activeCid && results[0]?.cid) {
        setActiveCid(results[0].cid);
      }
    } finally {
      setIsLoadingChannels(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    fetchChannels.current?.().catch(() => undefined);
  }, [open]);

  useEffect(() => {
    if (!isReady || !client || !auth?.user.id) {
      return;
    }

    fetchChannels.current?.().catch(() => undefined);
  }, [auth?.user.id, client, isReady]);

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

  const filteredChannels = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = channels.filter((c) => (c.id ?? "").startsWith("res-"));
    if (!q) {
      return base;
    }

    return base.filter((c) => {
      const id = c.id ?? "";
      const lastText = c.state.latestMessages?.[0]?.text ?? "";
      return id.toLowerCase().includes(q) || lastText.toLowerCase().includes(q);
    });
  }, [channels, query]);

  const unreadCount = useMemo(() => {
    return channels.reduce((sum, c) => sum + (c.state.unreadCount ?? 0), 0);
  }, [channels]);

  const activeChannel = useMemo(() => {
    if (!activeCid) {
      return null;
    }
    return channels.find((c) => c.cid === activeCid) ?? null;
  }, [activeCid, channels]);

  const myUserId = auth?.user.id ?? null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="relative h-12 w-12 rounded-full border shadow-lg"
          onClick={() => setOpen(true)}
        >
          <MessagesSquare className="h-5 w-5" />
          <span className="sr-only">Open owner inbox</span>
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
              <SheetTitle className="font-heading">Inbox</SheetTitle>
              <SheetDescription className="text-xs">
                Reservation messages across your venues
              </SheetDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
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
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search by reservation or message…"
                      className="pl-9"
                    />
                  </div>
                </div>

                <ScrollArea className={cn("h-[38vh]", isDesktop && "h-full")}>
                  <div className="divide-y">
                    {isLoadingChannels ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        Loading conversations…
                      </div>
                    ) : filteredChannels.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">
                        No reservation chats yet.
                      </div>
                    ) : (
                      filteredChannels.map((c) => {
                        const isActive = c.cid === activeCid;
                        const label = c.id?.startsWith("res-")
                          ? `Reservation ${c.id.replace("res-", "").slice(0, 8).toUpperCase()}`
                          : (c.id ?? c.cid);
                        const lastMessage =
                          c.state.latestMessages?.[0]?.text ?? "";
                        const unread = c.state.unreadCount ?? 0;

                        return (
                          <button
                            key={c.cid}
                            type="button"
                            className={cn(
                              "w-full text-left px-4 py-3 transition-colors",
                              isActive ? "bg-muted" : "hover:bg-muted/60",
                            )}
                            onClick={() => setActiveCid(c.cid)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">
                                  {label}
                                </div>
                                <div className="truncate text-xs text-muted-foreground">
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
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>

              {isDesktop ? <Separator orientation="vertical" /> : <Separator />}

              <div className="flex-1">
                {!isDesktop && activeChannel ? (
                  <div className="border-b px-4 py-3 text-sm font-medium">
                    {activeChannel.id?.startsWith("res-")
                      ? `Reservation ${activeChannel.id.replace("res-", "").slice(0, 8).toUpperCase()}`
                      : (activeChannel.id ?? "Conversation")}
                  </div>
                ) : null}

                <StreamChatThread
                  client={isReady ? client : null}
                  channelId={activeChannel?.id ?? null}
                  channelType={activeChannel?.type ?? "messaging"}
                  members={null}
                  myUserId={myUserId}
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
