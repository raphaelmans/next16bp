"use client";

import { ArchiveRestore, MessagesSquare, RefreshCw } from "lucide-react";
import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatSupportThreadTitle,
  getSupportThreadKind,
  getSupportThreadRequestId,
  type SupportThreadKind,
} from "../../domain";
import {
  useMutChatInboxArchiveThread,
  useMutChatInboxUnarchiveThread,
  useMutSupportChatBackfillClaimThreads,
  useMutSupportChatSendClaimMessage,
  useMutSupportChatSendVerificationMessage,
  useQueryChatAuth,
  useQueryChatInboxListArchivedThreadIds,
  useQuerySupportChatClaimSession,
  useQuerySupportChatVerificationSession,
} from "../../hooks/use-chat-trpc";
import { useModStreamClient } from "../../hooks/useModStreamClient";
import { StreamChatThread } from "../chat-thread/stream-chat-thread";
import {
  ReservationInboxWidget,
  type ReservationInboxWidgetConfig,
} from "../chat-widget/reservation-inbox-widget";
import { InboxFloatingSheet } from "../inbox-shell/inbox-floating-sheet";

type SupportChatKind = SupportThreadKind;

type SupportChannel = {
  id?: string;
  type?: string;
  state: {
    unreadCount?: number;
    latestMessages?: Array<{ text?: string }>;
    last_message_at?: Date | string | null;
  };
};

type UnifiedChatInterfaceProps =
  | {
      surface: "floating";
      domain: "reservation";
      reservationConfig: ReservationInboxWidgetConfig;
    }
  | {
      surface: "floating";
      domain: "support";
    }
  | {
      surface: "sheet";
      domain: "support";
      kind: SupportChatKind;
      requestId: string;
      triggerLabel?: string;
      triggerVariant?: React.ComponentProps<typeof Button>["variant"];
      triggerSize?: React.ComponentProps<typeof Button>["size"];
    };

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

function UnifiedSupportInbox() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isSmall = useMediaQuery("(min-width: 640px)");

  const storageKeys = {
    open: "admin_support_inbox_open",
    activeChannelId: "admin_support_inbox_active_channel",
  } as const;

  const [open, setOpen] = useState(false);
  const [channels, setChannels] = useState<SupportChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");

  const authQuery = useQueryChatAuth();
  const backfillClaimThreadsMutation = useMutSupportChatBackfillClaimThreads();
  const sendClaimMessageMutation = useMutSupportChatSendClaimMessage();
  const sendVerificationMessageMutation =
    useMutSupportChatSendVerificationMessage();
  const archiveThreadMutation = useMutChatInboxArchiveThread();
  const unarchiveThreadMutation = useMutChatInboxUnarchiveThread();
  const archivedThreadIdsQuery = useQueryChatInboxListArchivedThreadIds(
    { threadKind: "support" },
    { enabled: open },
  );
  const auth = authQuery.data;
  const backfillTriggeredForOpen = useRef(false);

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
    const storedOpen = readLocalStorage(storageKeys.open) === "1";
    const storedActive = readLocalStorage(storageKeys.activeChannelId);
    setOpen(storedOpen);
    setActiveChannelId(storedActive);
  }, [storageKeys.activeChannelId, storageKeys.open]);

  useEffect(() => {
    writeLocalStorage(storageKeys.open, open ? "1" : "0");
    if (!open) {
      setMobilePane("list");
    }
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
      setChannels(results as SupportChannel[]);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  const refreshInbox = async () => {
    await Promise.all([
      fetchChannels.current?.() ?? Promise.resolve(),
      archivedThreadIdsQuery.refetch(),
    ]);
  };

  useEffect(() => {
    if (!open) return;
    fetchChannels.current?.().catch(() => undefined);
  }, [open]);

  useEffect(() => {
    if (!open) {
      backfillTriggeredForOpen.current = false;
      return;
    }
    if (backfillTriggeredForOpen.current) {
      return;
    }
    backfillTriggeredForOpen.current = true;

    backfillClaimThreadsMutation.mutate(undefined, {
      onSettled: () => {
        fetchChannels.current?.().catch(() => undefined);
      },
    });
  }, [open, backfillClaimThreadsMutation]);

  useEffect(() => {
    if (!open) return;
    if (!isReady || !client || !auth?.user.id) return;
    fetchChannels.current?.().catch(() => undefined);
  }, [auth?.user.id, client, isReady, open]);

  useEffect(() => {
    if (!isReady || !client) return;
    const subscription = client.on((event: { type?: string }) => {
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
        return getSupportThreadKind(id) !== null;
      }),
    [channels],
  );

  const archivedThreadIdsSet = useMemo(
    () => new Set(archivedThreadIdsQuery.data?.threadIds ?? []),
    [archivedThreadIdsQuery.data?.threadIds],
  );

  const visibleChannels = useMemo(
    () =>
      supportChannels.filter((channel) => {
        const id = channel.id ?? "";
        return !archivedThreadIdsSet.has(id);
      }),
    [archivedThreadIdsSet, supportChannels],
  );

  const archivedChannels = useMemo(
    () =>
      supportChannels.filter((channel) => {
        const id = channel.id ?? "";
        return archivedThreadIdsSet.has(id);
      }),
    [archivedThreadIdsSet, supportChannels],
  );

  useEffect(() => {
    if (!open) return;
    if (activeChannelId) return;
    const first = visibleChannels[0] ?? null;
    if (first?.id) {
      setActiveChannelId(first.id);
    }
  }, [activeChannelId, open, visibleChannels]);

  const activeChannel = useMemo(() => {
    if (!activeChannelId) return null;
    return supportChannels.find((c) => c.id === activeChannelId) ?? null;
  }, [activeChannelId, supportChannels]);

  const unreadCount = useMemo(() => {
    return visibleChannels.reduce(
      (sum, c) => sum + (c.state.unreadCount ?? 0),
      0,
    );
  }, [visibleChannels]);

  const myUserId = auth?.user.id ?? null;
  const activeChannelIsArchived =
    !!activeChannelId && archivedThreadIdsSet.has(activeChannelId);

  const handleArchiveThread = async () => {
    if (!activeChannelId) {
      return;
    }

    await archiveThreadMutation.mutateAsync({
      threadKind: "support",
      threadId: activeChannelId,
    });
    await refreshInbox();
  };

  const handleUnarchiveThread = async (threadId?: string) => {
    const targetThreadId = threadId ?? activeChannelId;
    if (!targetThreadId) {
      return;
    }

    await unarchiveThreadMutation.mutateAsync({
      threadKind: "support",
      threadId: targetThreadId,
    });
    await refreshInbox();
  };

  const renderRow = (channel: SupportChannel) => {
    const id = channel.id ?? "";
    const unread = channel.state.unreadCount ?? 0;
    const lastMessage = channel.state.latestMessages?.[0]?.text ?? "";
    const kind = getSupportThreadKind(id);
    const isActive = id === activeChannelId;

    return (
      <button
        key={id}
        type="button"
        className={cn(
          "w-full text-left px-4 py-3 transition-colors",
          isActive ? "bg-muted" : "hover:bg-muted/60",
        )}
        onClick={() => {
          setActiveChannelId(id);
          if (!isDesktop) {
            setMobilePane("thread");
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">
                {formatSupportThreadTitle(id)}
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
                Archived ({archivedChannels.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Archived support threads</DialogTitle>
                <DialogDescription>
                  Unarchive a support thread to return it to the inbox.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[420px] pr-2">
                <div className="space-y-2">
                  {archivedChannels.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No archived support threads.
                    </div>
                  ) : (
                    archivedChannels.map((channel) => {
                      const id = channel.id ?? "";
                      const lastMessage =
                        channel.state.latestMessages?.[0]?.text ?? "";
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {formatSupportThreadTitle(id)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {lastMessage || "No messages yet"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={unarchiveThreadMutation.isPending}
                            onClick={() =>
                              handleUnarchiveThread(id).catch(() => undefined)
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
            disabled={isManualRefreshing}
            onClick={() => {
              setIsManualRefreshing(true);
              refreshInbox()
                .catch(() => undefined)
                .finally(() => setIsManualRefreshing(false));
            }}
          >
            <RefreshCw
              className={cn("h-4 w-4", isManualRefreshing && "animate-spin")}
            />
            <span className="sr-only">Refresh inbox</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="divide-y">
          {isLoadingChannels && supportChannels.length === 0 ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : visibleChannels.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No support threads yet.
            </div>
          ) : (
            visibleChannels.map(renderRow)
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
        headerTitle={
          activeChannel?.id
            ? formatSupportThreadTitle(activeChannel.id)
            : "Support chat"
        }
        headerSubtitle={
          activeChannel?.id
            ? getSupportThreadKind(activeChannel.id) === "claim"
              ? "Claim support"
              : "Verification support"
            : undefined
        }
        readOnly={!isReady}
        readOnlyReason={!isReady ? "Connecting..." : undefined}
        minHeightClassName="min-h-0 flex-1"
        onRefreshContext={async () => {
          setIsManualRefreshing(true);
          try {
            await refreshInbox();
          } finally {
            setIsManualRefreshing(false);
          }
        }}
        isContextRefreshing={isManualRefreshing}
        archiveActionLabel={
          activeChannelId
            ? activeChannelIsArchived
              ? "Unarchive"
              : "Archive"
            : undefined
        }
        onArchiveAction={
          activeChannelId
            ? activeChannelIsArchived
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
          const channelId = activeChannel?.id ?? null;
          const kind = getSupportThreadKind(channelId);
          const requestId = getSupportThreadRequestId(channelId);
          if (!kind || !requestId) {
            throw new Error("Conversation not selected");
          }

          if (kind === "claim") {
            await sendClaimMessageMutation.mutateAsync({
              claimRequestId: requestId,
              text: payload.text,
              attachments: payload.attachments,
            });
            return;
          }

          await sendVerificationMessageMutation.mutateAsync({
            placeVerificationRequestId: requestId,
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
      triggerLabel="Open support messages"
      triggerVariant="secondary"
      triggerClassName="border"
      sheetTitle="Support Inbox"
      sheetDescription="Conversations with owners about claims and verification."
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

function UnifiedSupportThreadSheet({
  kind,
  requestId,
  triggerLabel = "Message admin",
  triggerVariant = "outline",
  triggerSize,
}: {
  kind: SupportChatKind;
  requestId: string;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  triggerSize?: React.ComponentProps<typeof Button>["size"];
}) {
  const [open, setOpen] = useState(false);

  const claimQuery = useQuerySupportChatClaimSession(
    { claimRequestId: requestId },
    { enabled: open && kind === "claim" },
  );
  const sendClaimMessageMutation = useMutSupportChatSendClaimMessage();
  const sendVerificationMessageMutation =
    useMutSupportChatSendVerificationMessage();
  const verificationQuery = useQuerySupportChatVerificationSession(
    { placeVerificationRequestId: requestId },
    { enabled: open && kind === "verification" },
  );

  const session = kind === "claim" ? claimQuery.data : verificationQuery.data;
  const isLoading =
    kind === "claim" ? claimQuery.isLoading : verificationQuery.isLoading;
  const error = kind === "claim" ? claimQuery.error : verificationQuery.error;

  const streamAuth = session?.auth ?? null;
  const myUserId = streamAuth?.user.id ?? null;

  const { client, isReady } = useModStreamClient({
    apiKey: streamAuth?.apiKey ?? null,
    user: streamAuth?.user ?? null,
    tokenOrProvider: streamAuth?.token ?? null,
  });

  const headerTitle = useMemo(() => {
    if (!session) return "Support chat";
    return session.meta.kind === "claim"
      ? "Claim support"
      : "Verification support";
  }, [session]);

  const headerSubtitle = session ? session.meta.placeName : undefined;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant={triggerVariant} size={triggerSize}>
          <MessagesSquare className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex h-[88vh] min-h-0 flex-col gap-0 overflow-hidden p-0 supports-[height:100dvh]:h-[88dvh] sm:h-full sm:max-w-xl"
      >
        <SheetHeader className="border-b px-5 py-4 text-left">
          <SheetTitle className="font-heading">{headerTitle}</SheetTitle>
          <SheetDescription>
            {headerSubtitle
              ? headerSubtitle
              : "Message an admin about this request."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          {isLoading ? (
            <Skeleton className="h-full min-h-0 w-full" />
          ) : error ? (
            <div className="text-sm text-destructive">{error.message}</div>
          ) : (
            <StreamChatThread
              client={isReady ? client : null}
              channelType={session?.channel.channelType}
              channelId={session?.channel.channelId ?? null}
              members={session?.channel.memberIds ?? null}
              myUserId={myUserId}
              headerTitle={headerTitle}
              headerSubtitle={headerSubtitle}
              readOnly={!isReady}
              readOnlyReason={!isReady ? "Connecting..." : undefined}
              minHeightClassName="min-h-0 flex-1"
              onSendMessage={async (payload) => {
                if (kind === "claim") {
                  await sendClaimMessageMutation.mutateAsync({
                    claimRequestId: requestId,
                    text: payload.text,
                    attachments: payload.attachments,
                  });
                  return;
                }

                await sendVerificationMessageMutation.mutateAsync({
                  placeVerificationRequestId: requestId,
                  text: payload.text,
                  attachments: payload.attachments,
                });
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function UnifiedChatInterface(props: UnifiedChatInterfaceProps) {
  if (props.surface === "floating" && props.domain === "reservation") {
    return <ReservationInboxWidget config={props.reservationConfig} />;
  }

  if (props.surface === "floating" && props.domain === "support") {
    return <UnifiedSupportInbox />;
  }

  return (
    <UnifiedSupportThreadSheet
      kind={props.kind}
      requestId={props.requestId}
      triggerLabel={props.triggerLabel}
      triggerVariant={props.triggerVariant}
      triggerSize={props.triggerSize}
    />
  );
}
