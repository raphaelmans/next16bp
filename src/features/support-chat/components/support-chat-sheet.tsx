"use client";

import { MessagesSquare } from "lucide-react";
import type * as React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { StreamChatThread } from "@/features/chat/components/chat-thread/stream-chat-thread";
import { useStreamClient } from "@/features/chat/hooks/useStreamClient";
import { trpc } from "@/trpc/client";

type SupportChatKind = "claim" | "verification";

export function SupportChatSheet({
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
              client={client}
              channelType={session?.channel.channelType}
              channelId={session?.channel.channelId ?? null}
              members={session?.channel.memberIds ?? null}
              myUserId={myUserId}
              headerTitle={headerTitle}
              headerSubtitle={headerSubtitle}
              readOnly={!isReady}
              readOnlyReason={!isReady ? "Connecting..." : undefined}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
