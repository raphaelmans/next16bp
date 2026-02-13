"use client";

import { ChevronDown, MessagesSquare, RefreshCw } from "lucide-react";
import type * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "@/common/hooks/use-media-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useStreamClient } from "../../hooks/useStreamClient";
import { StreamChatThread } from "../chat-thread/stream-chat-thread";
import {
  ReservationInboxWidget,
  type ReservationInboxWidgetConfig,
} from "../chat-widget/reservation-inbox-widget";
import { InboxFloatingSheet } from "../inbox-shell/inbox-floating-sheet";

type SupportChatKind = "claim" | "verification";

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

function getSupportKind(
  channelId: string | null | undefined,
): SupportChatKind | null {
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

function getSupportRequestId(
  channelId: string | null | undefined,
): string | null {
  const id = channelId ?? "";
  if (id.startsWith("cr-") || id.startsWith("vr-")) {
    return id.slice(3);
  }
  return null;
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
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");

  const authQuery = trpc.chat.getAuth.useQuery();
  const backfillClaimThreadsMutation =
    trpc.supportChat.backfillClaimThreads.useMutation();
  const sendClaimMessageMutation =
    trpc.supportChat.sendClaimMessage.useMutation();
  const sendVerificationMessageMutation =
    trpc.supportChat.sendVerificationMessage.useMutation();
  const auth = authQuery.data;
  const backfillTriggeredForOpen = useRef(false);

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
    await fetchChannels.current?.();
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
        return id.startsWith("cr-") || id.startsWith("vr-");
      }),
    [channels],
  );

  const now = new Date();
  const isArchived = useMemo(() => {
    return (channel: SupportChannel) => {
      const last = channel.state.last_message_at;
      if (!last) return false;
      const lastDate = last instanceof Date ? last : new Date(String(last));
      const days = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      return days > 30;
    };
  }, [now]);

  const activeChannels = useMemo(
    () => supportChannels.filter((c) => !isArchived(c)),
    [isArchived, supportChannels],
  );
  const archivedChannels = useMemo(
    () => supportChannels.filter((c) => isArchived(c)),
    [isArchived, supportChannels],
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

  const renderRow = (channel: SupportChannel) => {
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

  const listPane = (
    <div
      className={cn(
        "flex min-h-0 w-full flex-1 flex-col",
        isDesktop && "w-[360px] flex-none",
      )}
    >
      <div className="border-b px-4 py-3">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            disabled={isLoadingChannels}
            onClick={() => refreshInbox().catch(() => undefined)}
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoadingChannels && "animate-spin")}
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
          ) : supportChannels.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No support threads yet.
            </div>
          ) : (
            <>
              {activeChannels.map(renderRow)}
              {archivedChannels.length > 0 ? (
                <Collapsible open={archiveOpen} onOpenChange={setArchiveOpen}>
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
  );

  const threadPane = (
    <div className="min-h-0 flex-1">
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
        onBack={!isDesktop ? () => setMobilePane("list") : undefined}
        backButtonLabel="Back to inbox"
        onSendMessage={async (payload) => {
          const channelId = activeChannel?.id ?? null;
          const kind = getSupportKind(channelId);
          const requestId = getSupportRequestId(channelId);
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

  const claimQuery = trpc.supportChat.getClaimSession.useQuery(
    { claimRequestId: requestId },
    { enabled: open && kind === "claim" },
  );
  const sendClaimMessageMutation =
    trpc.supportChat.sendClaimMessage.useMutation();
  const sendVerificationMessageMutation =
    trpc.supportChat.sendVerificationMessage.useMutation();
  const verificationQuery = trpc.supportChat.getVerificationSession.useQuery(
    { placeVerificationRequestId: requestId },
    { enabled: open && kind === "verification" },
  );

  const session = kind === "claim" ? claimQuery.data : verificationQuery.data;
  const isLoading =
    kind === "claim" ? claimQuery.isLoading : verificationQuery.isLoading;
  const error = kind === "claim" ? claimQuery.error : verificationQuery.error;

  const streamAuth = session?.auth ?? null;
  const myUserId = streamAuth?.user.id ?? null;

  const { client, isReady } = useStreamClient({
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
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-heading">{headerTitle}</SheetTitle>
          <SheetDescription>
            {headerSubtitle
              ? headerSubtitle
              : "Message an admin about this request."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-[520px] w-full" />
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
