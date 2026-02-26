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
import { trpc } from "@/trpc/client";
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
  useQueryChatInboxListArchivedThreadIds,
  useQuerySupportChatClaimSession,
  useQuerySupportChatVerificationSession,
} from "../../hooks/use-chat-trpc";
import { ChatThread } from "../chat-thread/chat-thread";
import {
  ReservationInboxWidget,
  type ReservationInboxWidgetConfig,
} from "../chat-widget/reservation-inbox-widget";
import { InboxFloatingSheet } from "../inbox-shell/inbox-floating-sheet";

type SupportChatKind = SupportThreadKind;

type ThreadSummary = {
  threadId: string;
  lastMessageText: string | null;
  lastMessageAt: string;
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
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [archivedDialogOpen, setArchivedDialogOpen] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");

  const meQuery = trpc.auth.me.useQuery();
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

  const myUserId = meQuery.data?.id ?? null;
  const backfillTriggeredForOpen = useRef(false);

  const claimThreadSummariesQuery =
    trpc.chatMessage.listThreadSummaries.useQuery(
      { threadIdPrefix: "cr-", limit: 30 },
      { enabled: open, refetchInterval: 15_000 },
    );
  const verificationThreadSummariesQuery =
    trpc.chatMessage.listThreadSummaries.useQuery(
      { threadIdPrefix: "vr-", limit: 30 },
      { enabled: open, refetchInterval: 15_000 },
    );

  const threads = useMemo(() => {
    const merged = [
      ...(claimThreadSummariesQuery.data?.threads ?? []),
      ...(verificationThreadSummariesQuery.data?.threads ?? []),
    ];
    const deduped = new Map<string, ThreadSummary>();

    for (const thread of merged) {
      deduped.set(thread.threadId, thread);
    }

    return Array.from(deduped.values())
      .sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      )
      .slice(0, 30);
  }, [
    claimThreadSummariesQuery.data?.threads,
    verificationThreadSummariesQuery.data?.threads,
  ]);

  const threadIds = useMemo(() => threads.map((t) => t.threadId), [threads]);
  const unreadCountsQuery = trpc.chatMessage.getUnreadCounts.useQuery(
    { threadIds },
    { enabled: open && threadIds.length > 0, refetchInterval: 15_000 },
  );
  const unreadCounts = unreadCountsQuery.data?.unreadCounts ?? {};

  useEffect(() => {
    const storedOpen = readLocalStorage(storageKeys.open) === "1";
    const storedActive = readLocalStorage(storageKeys.activeChannelId);
    setOpen(storedOpen);
    setActiveThreadId(storedActive);
  }, [storageKeys.activeChannelId, storageKeys.open]);

  useEffect(() => {
    writeLocalStorage(storageKeys.open, open ? "1" : "0");
    if (!open) {
      setMobilePane("list");
    }
  }, [open, storageKeys.open]);

  useEffect(() => {
    if (activeThreadId) {
      writeLocalStorage(storageKeys.activeChannelId, activeThreadId);
    }
  }, [activeThreadId, storageKeys.activeChannelId]);

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
        Promise.all([
          claimThreadSummariesQuery.refetch(),
          verificationThreadSummariesQuery.refetch(),
        ]).catch(() => undefined);
      },
    });
  }, [
    open,
    backfillClaimThreadsMutation,
    claimThreadSummariesQuery,
    verificationThreadSummariesQuery,
  ]);

  const refreshInbox = async () => {
    await Promise.all([
      claimThreadSummariesQuery.refetch(),
      verificationThreadSummariesQuery.refetch(),
      unreadCountsQuery.refetch(),
      archivedThreadIdsQuery.refetch(),
    ]);
  };

  const supportThreads = useMemo(
    () => threads.filter((t) => getSupportThreadKind(t.threadId) !== null),
    [threads],
  );

  const archivedThreadIdsSet = useMemo(
    () => new Set(archivedThreadIdsQuery.data?.threadIds ?? []),
    [archivedThreadIdsQuery.data?.threadIds],
  );

  const visibleThreads = useMemo(
    () => supportThreads.filter((t) => !archivedThreadIdsSet.has(t.threadId)),
    [archivedThreadIdsSet, supportThreads],
  );

  const archivedThreads = useMemo(
    () => supportThreads.filter((t) => archivedThreadIdsSet.has(t.threadId)),
    [archivedThreadIdsSet, supportThreads],
  );

  useEffect(() => {
    if (!open) return;
    if (activeThreadId) return;
    const first = visibleThreads[0] ?? null;
    if (first?.threadId) {
      setActiveThreadId(first.threadId);
    }
  }, [activeThreadId, open, visibleThreads]);

  const activeThread = useMemo(() => {
    if (!activeThreadId) return null;
    return supportThreads.find((t) => t.threadId === activeThreadId) ?? null;
  }, [activeThreadId, supportThreads]);

  const unreadCount = useMemo(() => {
    return visibleThreads.reduce(
      (sum, t) => sum + (unreadCounts[t.threadId] ?? 0),
      0,
    );
  }, [visibleThreads, unreadCounts]);

  const activeThreadIsArchived =
    !!activeThreadId && archivedThreadIdsSet.has(activeThreadId);

  const handleArchiveThread = async () => {
    if (!activeThreadId) return;
    await archiveThreadMutation.mutateAsync({
      threadKind: "support",
      threadId: activeThreadId,
    });
    await refreshInbox();
  };

  const handleUnarchiveThread = async (threadId?: string) => {
    const targetThreadId = threadId ?? activeThreadId;
    if (!targetThreadId) return;
    await unarchiveThreadMutation.mutateAsync({
      threadKind: "support",
      threadId: targetThreadId,
    });
    await refreshInbox();
  };

  const renderRow = (thread: ThreadSummary) => {
    const id = thread.threadId;
    const unread = unreadCounts[id] ?? 0;
    const lastMessage = thread.lastMessageText ?? "";
    const kind = getSupportThreadKind(id);
    const isActive = id === activeThreadId;

    return (
      <button
        key={id}
        type="button"
        className={cn(
          "w-full text-left px-4 py-3 transition-colors",
          isActive ? "bg-muted" : "hover:bg-muted/60",
        )}
        onClick={() => {
          setActiveThreadId(id);
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

  const isLoadingThreads =
    (claimThreadSummariesQuery.isLoading ||
      verificationThreadSummariesQuery.isLoading) &&
    supportThreads.length === 0;

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
                Archived ({archivedThreads.length})
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
                  {archivedThreads.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No archived support threads.
                    </div>
                  ) : (
                    archivedThreads.map((thread) => {
                      const id = thread.threadId;
                      const lastMessage = thread.lastMessageText ?? "";
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
          {isLoadingThreads ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : visibleThreads.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No support threads yet.
            </div>
          ) : (
            visibleThreads.map(renderRow)
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const threadPane = (
    <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
      <ChatThread
        threadId={activeThread?.threadId ?? null}
        myUserId={myUserId}
        headerTitle={
          activeThread?.threadId
            ? formatSupportThreadTitle(activeThread.threadId)
            : "Support chat"
        }
        headerSubtitle={
          activeThread?.threadId
            ? getSupportThreadKind(activeThread.threadId) === "claim"
              ? "Claim support"
              : "Verification support"
            : undefined
        }
        readOnly={!myUserId}
        readOnlyReason={!myUserId ? "Connecting..." : undefined}
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
          activeThreadId
            ? activeThreadIsArchived
              ? "Unarchive"
              : "Archive"
            : undefined
        }
        onArchiveAction={
          activeThreadId
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
          const threadId = activeThread?.threadId ?? null;
          const kind = getSupportThreadKind(threadId);
          const requestId = getSupportThreadRequestId(threadId);
          if (!kind || !requestId) {
            throw new Error("Conversation not selected");
          }

          if (kind === "claim") {
            await sendClaimMessageMutation.mutateAsync({
              claimRequestId: requestId,
              text: payload.text,
              attachments: payload.attachments?.map((a) => ({
                type: a.type,
                asset_url: a.url,
                title: a.filename,
                file_size: a.fileSize,
                mime_type: a.mimeType,
              })),
            });
            return;
          }

          await sendVerificationMessageMutation.mutateAsync({
            placeVerificationRequestId: requestId,
            text: payload.text,
            attachments: payload.attachments?.map((a) => ({
              type: a.type,
              asset_url: a.url,
              title: a.filename,
              file_size: a.fileSize,
              mime_type: a.mimeType,
            })),
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
      authLoading={meQuery.isLoading}
      authErrorMessage={meQuery.isError ? meQuery.error.message : null}
      clientErrorMessage={null}
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

  const myUserId = session?.auth.user.id ?? null;
  const threadId = session?.channel.channelId ?? null;

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
            {headerSubtitle ?? "Message an admin about this request."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          {isLoading ? (
            <Skeleton className="h-full min-h-0 w-full" />
          ) : error ? (
            <div className="text-sm text-destructive">{error.message}</div>
          ) : (
            <ChatThread
              threadId={threadId}
              myUserId={myUserId}
              headerTitle={headerTitle}
              headerSubtitle={headerSubtitle}
              readOnly={!myUserId}
              readOnlyReason={!myUserId ? "Connecting..." : undefined}
              minHeightClassName="min-h-0 flex-1"
              onSendMessage={async (payload) => {
                if (kind === "claim") {
                  await sendClaimMessageMutation.mutateAsync({
                    claimRequestId: requestId,
                    text: payload.text,
                    attachments: payload.attachments?.map((a) => ({
                      type: a.type,
                      asset_url: a.url,
                      title: a.filename,
                      file_size: a.fileSize,
                      mime_type: a.mimeType,
                    })),
                  });
                  return;
                }

                await sendVerificationMessageMutation.mutateAsync({
                  placeVerificationRequestId: requestId,
                  text: payload.text,
                  attachments: payload.attachments?.map((a) => ({
                    type: a.type,
                    asset_url: a.url,
                    title: a.filename,
                    file_size: a.fileSize,
                    mime_type: a.mimeType,
                  })),
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
